import json
import os
import psycopg2
from typing import Dict, Any

def get_db_connection():
    """Get database connection using DATABASE_URL secret"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''
    Business: API for user management - create users, list users, manage roles
    Args: event - dict with httpMethod, body, queryStringParameters, pathParams
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict with user data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if method == 'GET':
            # Get all users
            cursor.execute("""
                SELECT id, username, name, role, city, is_active, created_at, rating, tournaments, wins, losses, draws
                FROM t_p79348767_tournament_site_buil.users
                ORDER BY created_at DESC
            """)
            
            users = []
            for row in cursor.fetchall():
                users.append({
                    'id': row[0],
                    'username': row[1],
                    'name': row[2],
                    'role': row[3],
                    'city': row[4],
                    'is_active': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'rating': row[7],
                    'tournaments': row[8],
                    'wins': row[9],
                    'losses': row[10],
                    'draws': row[11]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users})
            }
        
        elif method == 'POST':
            # Create new user
            body_data = json.loads(event.get('body', '{}'))
            username = body_data.get('username', '').strip()
            password = body_data.get('password', '').strip()
            name = body_data.get('name', '').strip()
            role = body_data.get('role', 'player')
            city = body_data.get('city', '').strip() or None
            
            if not all([username, password, name]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username, password and name are required'})
                }
            
            # Escape single quotes in strings
            username_escaped = username.replace("'", "''")
            password_escaped = password.replace("'", "''")
            name_escaped = name.replace("'", "''")
            city_escaped = city.replace("'", "''") if city else None
            
            # Check if username exists
            cursor.execute(f"SELECT id FROM t_p79348767_tournament_site_buil.users WHERE username = '{username_escaped}';")
            if cursor.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username already exists'})
                }
            
            if city_escaped:
                cursor.execute(f"""
                    INSERT INTO t_p79348767_tournament_site_buil.users (username, password, name, role, city, is_active)
                    VALUES ('{username_escaped}', '{password_escaped}', '{name_escaped}', '{role}', '{city_escaped}', true)
                    RETURNING id, username, name, role, city, is_active, created_at, rating;
                """)
            else:
                cursor.execute(f"""
                    INSERT INTO t_p79348767_tournament_site_buil.users (username, password, name, role, city, is_active)
                    VALUES ('{username_escaped}', '{password_escaped}', '{name_escaped}', '{role}', NULL, true)
                    RETURNING id, username, name, role, city, is_active, created_at, rating;
                """)
            
            row = cursor.fetchone()
            conn.commit()
            
            user = {
                'id': row[0],
                'username': row[1],
                'name': row[2],
                'role': row[3],
                'city': row[4],
                'is_active': row[5],
                'created_at': row[6].isoformat() if row[6] else None,
                'rating': row[7]
            }
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'user': user})
            }
        
        elif method == 'PUT':
            # Update user (single user or batch updates)
            query_params = event.get('queryStringParameters') or {}
            batch_mode = query_params.get('batch') == 'true'
            
            if batch_mode:
                # Batch update multiple users (for tournament rating updates)
                body_data = json.loads(event.get('body', '{}'))
                updates = body_data.get('updates', [])
                
                if not updates:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'No updates provided'})
                    }
                
                # Update each user individually
                updated_count = 0
                for update in updates:
                    user_id = update.get('user_id')
                    rating = update.get('rating')
                    tournaments = update.get('tournaments')
                    wins = update.get('wins')
                    losses = update.get('losses')
                    draws = update.get('draws')
                    
                    if user_id is not None:
                        cursor.execute(f"""
                            UPDATE t_p79348767_tournament_site_buil.users
                            SET rating = {rating},
                                tournaments = {tournaments},
                                wins = {wins},
                                losses = {losses},
                                draws = {draws}
                            WHERE id = {user_id};
                        """)
                        updated_count += cursor.rowcount
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'updated_count': updated_count
                    })
                }
            
            else:
                # Single user update (toggle status, change role, etc.)
                path_params = event.get('pathParams', {})
                user_id = path_params.get('id')
                body_data = json.loads(event.get('body', '{}'))
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User ID required'})
                    }
                
                updates = []
                values = []
                
                if 'is_active' in body_data:
                    updates.append('is_active = %s')
                    values.append(body_data['is_active'])
                
                if 'role' in body_data:
                    updates.append('role = %s')
                    values.append(body_data['role'])
                
                if not updates:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'No updates provided'})
                    }
                
                values.append(user_id)
                
                # Build update query with proper escaping
                update_clauses = []
                for i, update in enumerate(updates):
                    if 'is_active' in update:
                        update_clauses.append(f"is_active = {values[i]}")
                    elif 'role' in update:
                        update_clauses.append(f"role = '{values[i]}'")
                
                cursor.execute(f"""
                    UPDATE t_p79348767_tournament_site_buil.users
                    SET {', '.join(update_clauses)}
                    WHERE id = {user_id}
                    RETURNING id, username, name, role, city, is_active;
                """)
                
                row = cursor.fetchone()
                if not row:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                conn.commit()
                
                user = {
                    'id': row[0],
                    'username': row[1],
                    'name': row[2],
                    'role': row[3],
                    'city': row[4],
                    'is_active': row[5]
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': user})
                }
        
        elif method == 'DELETE':
            # Delete user with cascade delete of related records
            query_params = event.get('queryStringParameters') or {}
            user_id = query_params.get('id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User ID required'})
                }
            
            # First, check if user exists
            cursor.execute(f"SELECT id FROM t_p79348767_tournament_site_buil.users WHERE id = {user_id};")
            if not cursor.fetchone():
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
            # Delete related games where user is player1 or player2
            cursor.execute(f"""
                DELETE FROM t_p79348767_tournament_site_buil.games 
                WHERE player1_id = {user_id} OR player2_id = {user_id};
            """)
            
            # Remove user from tournament participants arrays
            cursor.execute(f"""
                UPDATE t_p79348767_tournament_site_buil.tournaments
                SET participants = array_remove(participants, {user_id})
                WHERE {user_id} = ANY(participants);
            """)
            
            # Finally, delete the user
            cursor.execute(f"DELETE FROM t_p79348767_tournament_site_buil.users WHERE id = {user_id};")
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'User deleted successfully'})
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        # Rollback transaction if exists
        if conn:
            try:
                conn.rollback()
            except:
                pass
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        # Always close resources
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass