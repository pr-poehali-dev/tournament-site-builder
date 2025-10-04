import json
import jwt
import os
from typing import Dict, Any, Optional, Tuple

def verify_token(event: Dict[str, Any]) -> Tuple[bool, Optional[Dict], Optional[str]]:
    '''
    Business: Verify JWT token from request headers
    Args: event - dict with headers containing X-Auth-Token
    Returns: (is_valid, user_data, error_message)
    '''
    headers = event.get('headers', {})
    
    # Get token from X-Auth-Token header
    token = headers.get('x-auth-token') or headers.get('X-Auth-Token')
    
    if not token:
        return False, None, 'Missing authentication token'
    
    jwt_secret = os.environ.get('JWT_SECRET')
    if not jwt_secret:
        return False, None, 'Server configuration error'
    
    try:
        # Verify and decode token
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return True, payload, None
    except jwt.ExpiredSignatureError:
        return False, None, 'Token expired'
    except jwt.InvalidTokenError:
        return False, None, 'Invalid token'

def create_error_response(message: str, status_code: int = 401) -> Dict[str, Any]:
    '''Create standardized error response'''
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': message, 'success': False})
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: JWT middleware for API authentication
    Args: event - dict with httpMethod, headers
          context - execution context
    Returns: Authentication result or error
    '''
    method = event.get('httpMethod', 'GET')
    
    # Handle CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Verify token
    is_valid, user_data, error_msg = verify_token(event)
    
    if not is_valid:
        return create_error_response(error_msg or 'Unauthorized', 401)
    
    # Return user data for authenticated request
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'success': True, 'user': user_data})
    }
