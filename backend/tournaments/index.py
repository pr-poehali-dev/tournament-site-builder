import json
import os
import psycopg2
import jwt
from typing import Dict, Any, Optional, Tuple

def verify_token(event: Dict[str, Any]) -> Tuple[bool, Optional[Dict], Optional[str]]:
    '''Verify JWT token from request headers'''
    headers = event.get('headers', {})
    token = headers.get('x-auth-token') or headers.get('X-Auth-Token')
    
    if not token:
        return False, None, 'Missing authentication token'
    
    jwt_secret = os.environ.get('JWT_SECRET')
    if not jwt_secret:
        return False, None, 'Server configuration error'
    
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return True, payload, None
    except jwt.ExpiredSignatureError:
        return False, None, 'Token expired'
    except jwt.InvalidTokenError:
        return False, None, 'Invalid token'

def create_auth_error(message: str, status_code: int = 401) -> Dict[str, Any]:
    '''Create authentication error response'''
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
    Business: Get tournaments from database
    Args: event - dict with httpMethod, body 
          context - object with request_id
    Returns: HTTP response dict with tournaments list
    '''
    method = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    if method == 'GET':
        # GET is public - no auth required
        try:
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
            
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, name, format, status, swiss_rounds, top_rounds,
                       created_at, updated_at, city, is_rated, judge_id, participants, current_round, confirmed, dropped_players
                FROM t_p79348767_tournament_site_buil.tournaments
                ORDER BY created_at DESC
            """)
            
            rows = cursor.fetchall()
            
            tournaments = []
            for row in rows:
                tournaments.append({
                    'id': row[0],
                    'name': row[1],
                    'format': row[2],
                    'status': row[3],
                    'swiss_rounds': row[4],
                    'top_rounds': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'updated_at': row[7].isoformat() if row[7] else None,
                    'city': row[8],
                    'is_rated': row[9],
                    'judge_id': row[10],
                    'participants': row[11] if row[11] else [],
                    'current_round': row[12] if len(row) > 12 else 0,
                    'confirmed': row[13] if len(row) > 13 else False,
                    'droppedPlayers': row[14] if len(row) > 14 and row[14] else []
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'tournaments': tournaments})
            }
            
        except psycopg2.Error as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'Database error: {str(e)}'})
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'Unexpected error: {str(e)}'})
            }
    
    elif method == 'POST':
        # Require authentication for creating tournaments
        is_valid, user_data, error_msg = verify_token(event)
        if not is_valid:
            return create_auth_error(error_msg or 'Unauthorized')
        
        try:
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name', '').strip()
            tournament_type = body_data.get('type', 'top')
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Tournament name is required'})
                }
            
            # Mock tournament creation
            tournament = {
                'id': 2,
                'name': name,
                'type': tournament_type,
                'status': 'setup',
                'current_round': 0,
                'max_rounds': None,
                'created_at': '2025-09-20T18:50:00.000Z'
            }
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'tournament': tournament})
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'JSON parse error: {str(e)}'})
            }
    
    elif method == 'PUT':
        # Require authentication for updating tournaments
        is_valid, user_data, error_msg = verify_token(event)
        if not is_valid:
            return create_auth_error(error_msg or 'Unauthorized')
        
        try:
            body_data = json.loads(event.get('body', '{}'))
            tournament_id = body_data.get('id')
            status = body_data.get('status')
            current_round = body_data.get('current_round')
            confirmed = body_data.get('confirmed')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Tournament ID is required'})
                }
            
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
            
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            # Build UPDATE query dynamically based on provided fields
            update_fields = []
            if status is not None:
                escaped_status = status.replace("'", "''")
                update_fields.append(f"status = '{escaped_status}'")
            if current_round is not None:
                update_fields.append(f"current_round = {int(current_round)}")
            if confirmed is not None:
                update_fields.append(f"confirmed = {str(bool(confirmed)).upper()}")
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'No fields to update'})
                }
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_query = f"""
                UPDATE t_p79348767_tournament_site_buil.tournaments
                SET {', '.join(update_fields)}
                WHERE id = {int(tournament_id)}
                RETURNING id, status, current_round, updated_at
            """
            
            cursor.execute(update_query)
            row = cursor.fetchone()
            conn.commit()
            
            if not row:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Tournament not found'})
                }
            
            updated_tournament = {
                'id': row[0],
                'status': row[1],
                'current_round': row[2],
                'updated_at': row[3].isoformat() if row[3] else None
            }
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'tournament': updated_tournament
                })
            }
            
        except psycopg2.Error as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'Database error: {str(e)}'})
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'Unexpected error: {str(e)}'})
            }
    
    else:
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }