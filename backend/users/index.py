import json
import os
import psycopg2
import bcrypt
from typing import Dict, Any

def get_db_connection():
    """Get database connection using DATABASE_URL secret"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

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
            
            # Hash password with bcrypt
            hashed_password = hash_password(password)
            
            # Check if username exists - using parameterized query
            cursor.execute("""
                SELECT id FROM t_p79348767_tournament_site_buil.users 
                WHERE username = %s
            """, (username,))
            
            if cursor.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username already exists'})
                }
            
            # Insert new user - using parameterized query
            cursor.execute("""
                INSERT INTO t_p79348767_tournament_site_buil.users 
                (username, password, name, role, city, is_active)
                VALUES (%s, %s, %s, %s, %s, true)
                RETURNING id, username, name, role, city, is_active, created_at, rating
            """, (username, hashed_password, name, role, city))
            
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
                
                # Update each user individually with parameterized queries
                updated_count = 0
                for update in updates:
                    user_id = update.get('user_id')
                    rating = update.get('rating')
                    tournaments = update.get('tournaments')
                    wins = update.get('wins')
                    losses = update.get('losses')
                    draws = update.get('draws')
                    
                    if user_id is not None:
                        cursor.execute("""
                            UPDATE t_p79348767_tournament_site_buil.users
                            SET rating = %s,
                                tournaments = %s,
                                wins = %s,
                                losses = %s,
                                draws = %s
                            WHERE id = %s
                        """, (rating, tournaments, wins, losses, draws, user_id))
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
                # Single user update (toggle status, change role, profile edit, etc.)
                query_params = event.get('queryStringParameters') or {}
                user_id = query_params.get('id')
                body_data = json.loads(event.get('body', '{}'))
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User ID required'})
                    }
                
                # Build update query with parameterized values
                update_parts = []
                update_values = []
                
                if 'is_active' in body_data:
                    update_parts.append("is_active = %s")
                    update_values.append(body_data['is_active'])
                
                if 'role' in body_data:
                    update_parts.append("role = %s")
                    update_values.append(body_data['role'])
                
                if 'name' in body_data:
                    update_parts.append("name = %s")
                    update_values.append(body_data['name'])
                
                if 'city' in body_data:
                    update_parts.append("city = %s")
                    update_values.append(body_data['city'] if body_data['city'] else None)
                
                if 'password' in body_data and body_data['password']:
                    # Hash password with bcrypt before storing
                    hashed_password = hash_password(body_data['password'])
                    update_parts.append("password = %s")
                    update_values.append(hashed_password)
                
                if not update_parts:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'No updates provided'})
                    }
                
                # Add user_id to values list
                update_values.append(user_id)
                
                cursor.execute(f"""
                    UPDATE t_p79348767_tournament_site_buil.users
                    SET {', '.join(update_parts)}
                    WHERE id = %s
                    RETURNING id, username, name, role, city, is_active
                """, update_values)
                
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
            # Delete user only if they never participated in any tournament
            query_params = event.get('queryStringParameters') or {}
            user_id = query_params.get('id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User ID required'})
                }
            
            # First, check if user exists - parameterized query
            cursor.execute("""
                SELECT id FROM t_p79348767_tournament_site_buil.users 
                WHERE id = %s
            """, (user_id,))
            
            if not cursor.fetchone():
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
            # Check if user participated in any games - parameterized query
            cursor.execute("""
                SELECT COUNT(*) FROM t_p79348767_tournament_site_buil.games 
                WHERE player1_id = %s OR player2_id = %s
            """, (user_id, user_id))
            
            games_count = cursor.fetchone()[0]
            
            if games_count > 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'Нельзя удалить пользователя, который участвовал в турнирах',
                        'details': f'Пользователь сыграл {games_count} игр(ы)'
                    })
                }
            
            # Check if user is in any tournament participants - parameterized query
            cursor.execute("""
                SELECT COUNT(*) FROM t_p79348767_tournament_site_buil.tournaments
                WHERE %s = ANY(participants)
            """, (user_id,))
            
            tournaments_count = cursor.fetchone()[0]
            
            if tournaments_count > 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'Нельзя удалить пользователя, который зарегистрирован в турнирах',
                        'details': f'Пользователь участвует в {tournaments_count} турнире(ах)'
                    })
                }
            
            # Delete the user - parameterized query
            cursor.execute("""
                DELETE FROM t_p79348767_tournament_site_buil.users 
                WHERE id = %s
            """, (user_id,))
            
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
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
