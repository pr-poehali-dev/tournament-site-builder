import json
import os
import psycopg2
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any
import time

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication with bcrypt hashing (v2)
    Args: event - dict with httpMethod, body containing username and password
          context - object with attributes: request_id, function_name
    Returns: HTTP response with user data if credentials are valid
    '''
    method = event.get('httpMethod', 'POST')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Get database connection
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
    try:
        body_str = event.get('body') or '{}'
        body_data = json.loads(body_str) if body_str else {}
        username = body_data.get('username', '').strip() if body_data.get('username') else ''
        password = body_data.get('password', '').strip() if body_data.get('password') else ''
        source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Username and password are required'})
            }
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Check for rate limiting
        current_time = int(time.time())
        cursor.execute("""
            SELECT attempt_count, last_attempt 
            FROM t_p79348767_tournament_site_buil.login_attempts 
            WHERE ip_address = %s OR username = %s
            ORDER BY last_attempt DESC LIMIT 1
        """, (source_ip, username))
        
        rate_limit_row = cursor.fetchone()
        if rate_limit_row:
            attempt_count, last_attempt = rate_limit_row
            time_diff = current_time - int(last_attempt.timestamp()) if hasattr(last_attempt, 'timestamp') else 0
            
            # Block if 5+ attempts in last 15 minutes (900 seconds)
            if attempt_count >= 5 and time_diff < 900:
                time.sleep(2)  # Slow down brute force attempts
                return {
                    'statusCode': 429,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Too many login attempts. Please try again later.'})
                }
            
            # Reset counter if more than 15 minutes passed
            if time_diff >= 900:
                cursor.execute("""
                    DELETE FROM t_p79348767_tournament_site_buil.login_attempts 
                    WHERE ip_address = %s OR username = %s
                """, (source_ip, username))
                conn.commit()
        
        cursor.execute("""
            SELECT id, username, name, role, city, is_active, password, rating
            FROM t_p79348767_tournament_site_buil.users
            WHERE username = %s
        """, (username,))
        
        row = cursor.fetchone()
        
        if not row:
            # Record failed attempt
            cursor.execute("""
                INSERT INTO t_p79348767_tournament_site_buil.login_attempts (ip_address, username, attempt_count, last_attempt)
                VALUES (%s, %s, 1, NOW())
                ON CONFLICT (ip_address, username) 
                DO UPDATE SET attempt_count = login_attempts.attempt_count + 1, last_attempt = NOW()
            """, (source_ip, username))
            conn.commit()
            cursor.close()
            conn.close()
            
            time.sleep(1)  # Slow down enumeration attacks
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        user_id, db_username, name, role, city, is_active, db_password, rating = row
        
        if not is_active:
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'User is blocked'})
            }
        
        # Verify password using bcrypt
        password_bytes = password.encode('utf-8')
        db_password_bytes = db_password.encode('utf-8')
        
        if not bcrypt.checkpw(password_bytes, db_password_bytes):
            # Record failed attempt
            cursor.execute("""
                INSERT INTO t_p79348767_tournament_site_buil.login_attempts (ip_address, username, attempt_count, last_attempt)
                VALUES (%s, %s, 1, NOW())
                ON CONFLICT (ip_address, username) 
                DO UPDATE SET attempt_count = login_attempts.attempt_count + 1, last_attempt = NOW()
            """, (source_ip, username))
            conn.commit()
            cursor.close()
            conn.close()
            
            time.sleep(1)  # Slow down brute force attacks
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        # Authentication successful - clear failed attempts
        cursor.execute("""
            DELETE FROM t_p79348767_tournament_site_buil.login_attempts 
            WHERE ip_address = %s OR username = %s
        """, (source_ip, username))
        conn.commit()
        cursor.close()
        conn.close()
        
        # Generate JWT token
        jwt_secret = os.environ.get('JWT_SECRET')
        if not jwt_secret:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'JWT not configured'})
            }
        
        # Create JWT token with user data (expires in 7 days)
        token_payload = {
            'userId': user_id,
            'username': db_username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        
        token = jwt.encode(token_payload, jwt_secret, algorithm='HS256')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'token': token,
                'user': {
                    'id': user_id,
                    'username': db_username,
                    'name': name,
                    'role': role,
                    'city': city,
                    'isActive': is_active,
                    'rating': rating
                }
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }