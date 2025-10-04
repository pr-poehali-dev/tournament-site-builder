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
    
    # Get token from X-Auth-Token header (case-insensitive)
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

def create_auth_error_response(message: str, status_code: int = 401) -> Dict[str, Any]:
    '''Create standardized authentication error response'''
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': message, 'success': False})
    }

def require_auth(event: Dict[str, Any], required_roles: Optional[list] = None) -> Tuple[bool, Optional[Dict], Optional[Dict]]:
    '''
    Business: Check authentication and optionally verify role
    Args: event - request event, required_roles - list of allowed roles (optional)
    Returns: (is_authorized, user_data, error_response)
    '''
    is_valid, user_data, error_msg = verify_token(event)
    
    if not is_valid:
        return False, None, create_auth_error_response(error_msg or 'Unauthorized')
    
    # Check role if required
    if required_roles:
        user_role = user_data.get('role')
        if user_role not in required_roles:
            return False, user_data, create_auth_error_response('Insufficient permissions', 403)
    
    return True, user_data, None
