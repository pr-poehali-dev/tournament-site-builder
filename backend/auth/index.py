import json
import os
import psycopg2
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any
import time

# CORS configuration inline (shared module doesn't work in cloud functions)
ALLOWED_ORIGINS = [
    'https://poehali.dev',
    'https://www.poehali.dev',
    'http://localhost:5173',
    'http://localhost:3000'
]

def get_cors_headers(origin: str = None) -> dict:
    if origin and origin in ALLOWED_ORIGINS:
        allowed_origin = origin
    else:
        allowed_origin = ALLOWED_ORIGINS[0]
    
    return {
        'Access-Control-Allow-Origin': allowed_origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id, X-Session-Id',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true'
    }

def create_response(status_code: int, body: dict, origin: str = None) -> dict:
    headers = {
        'Content-Type': 'application/json',
        **get_cors_headers(origin)
    }
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'isBase64Encoded': False,
        'body': json.dumps(body)
    }

def refresh_token_handler(event: Dict[str, Any], origin: str) -> Dict[str, Any]:
    '''Refresh JWT token if still valid'''
    try:
        auth_header = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
        
        if not auth_header:
            return create_response(401, {'error': 'No token provided'}, origin)
        
        jwt_secret = os.environ.get('JWT_SECRET')
        if not jwt_secret:
            return create_response(500, {'error': 'JWT not configured'}, origin)
        
        # Decode token (will fail if expired or invalid)
        try:
            payload = jwt.decode(auth_header, jwt_secret, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return create_response(401, {'error': 'Token expired'}, origin)
        except jwt.InvalidTokenError:
            return create_response(401, {'error': 'Invalid token'}, origin)
        
        # Generate new token with same data but fresh expiration
        new_payload = {
            'userId': payload['userId'],
            'username': payload['username'],
            'role': payload['role'],
            'exp': datetime.utcnow() + timedelta(hours=2)
        }
        
        new_token = jwt.encode(new_payload, jwt_secret, algorithm='HS256')
        
        return create_response(200, {
            'success': True,
            'token': new_token
        }, origin)
        
    except Exception as e:
        return create_response(500, {'error': f'Token refresh failed: {str(e)}'}, origin)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication with bcrypt hashing and token refresh
    Args: event - dict with httpMethod, body containing username and password OR X-Auth-Token for refresh
          context - object with attributes: request_id, function_name
    Returns: HTTP response with user data if credentials are valid
    '''
    method = event.get('httpMethod', 'POST')
    origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin')
    path = event.get('path', '/')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(origin),
            'isBase64Encoded': False,
            'body': ''
        }
    
    # Handle token refresh endpoint
    if method == 'POST' and path.endswith('/refresh'):
        return refresh_token_handler(event, origin)
    
    if method != 'POST':
        return create_response(405, {'error': 'Method not allowed'}, origin)
    
    # Get database connection
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return create_response(500, {'error': 'Database connection not configured'}, origin)
    
    try:
        body_str = event.get('body') or '{}'
        body_data = json.loads(body_str) if body_str else {}
        username = body_data.get('username', '').strip() if body_data.get('username') else ''
        password = body_data.get('password', '').strip() if body_data.get('password') else ''
        source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
        
        if not username or not password:
            return create_response(400, {'error': 'Username and password are required'}, origin)
        
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
                return create_response(429, {'error': 'Too many login attempts. Please try again later.'}, origin)
            
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
            return create_response(401, {'error': 'Invalid credentials'}, origin)
        
        user_id, db_username, name, role, city, is_active, db_password, rating = row
        
        if not is_active:
            cursor.close()
            conn.close()
            return create_response(403, {'error': 'User is blocked'}, origin)
        
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
            return create_response(401, {'error': 'Invalid credentials'}, origin)
        
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
            return create_response(500, {'error': 'JWT not configured'}, origin)
        
        # Create JWT token with user data (expires in 2 hours)
        token_payload = {
            'userId': user_id,
            'username': db_username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=2)
        }
        
        token = jwt.encode(token_payload, jwt_secret, algorithm='HS256')
        
        return create_response(200, {
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
        }, origin)
        
    except Exception as e:
        return create_response(500, {'error': f'Internal server error: {str(e)}'}, origin)