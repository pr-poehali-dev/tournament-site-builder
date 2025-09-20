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
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if method == 'GET':
            # Get all users
            cursor.execute("""
                SELECT id, username, name, role, city, is_active, created_at
                FROM users
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
                    'created_at': row[6].isoformat() if row[6] else None
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
            
            # Check if username exists
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username already exists'})
                }
            
            cursor.execute("""
                INSERT INTO users (username, password, name, role, city, is_active)
                VALUES (%s, %s, %s, %s, %s, true)
                RETURNING id, username, name, role, city, is_active, created_at
            """, (username, password, name, role, city))
            
            row = cursor.fetchone()
            conn.commit()
            
            user = {
                'id': row[0],
                'username': row[1],
                'name': row[2],
                'role': row[3],
                'city': row[4],
                'is_active': row[5],
                'created_at': row[6].isoformat() if row[6] else None
            }
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'user': user})
            }
        
        elif method == 'PUT':
            # Update user (toggle status, change role, etc.)
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
            
            cursor.execute(f"""
                UPDATE users
                SET {', '.join(updates)}
                WHERE id = %s
                RETURNING id, username, name, role, city, is_active
            """, values)
            
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
            # Delete user
            path_params = event.get('pathParams', {})
            user_id = path_params.get('id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User ID required'})
                }
            
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            
            if cursor.rowcount == 0:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
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
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()