import json
import os
import psycopg2
import jwt
from typing import Dict, Any, List, Optional, Tuple

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
    Business: Manage tournament games (pairings and results)
    Args: event - dict with httpMethod, body containing game data
          context - execution context
    Returns: HTTP response dict
    '''
    method = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
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
    
    if method == 'GET':
        # GET is public - no auth required (like tournaments)
        # Get games for a tournament
        try:
            query_params = event.get('queryStringParameters', {}) or {}
            tournament_id = query_params.get('tournament_id')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'tournament_id is required'})
                }
            
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, tournament_id, round_number, player1_id, player2_id, result, table_number, created_at, updated_at
                FROM t_p79348767_tournament_site_buil.games
                WHERE tournament_id = %s
                ORDER BY round_number, id
            """, (tournament_id,))
            
            rows = cursor.fetchall()
            games = []
            
            for row in rows:
                games.append({
                    'id': row[0],
                    'tournament_id': row[1],
                    'round_number': row[2],
                    'player1_id': row[3],
                    'player2_id': row[4],
                    'result': row[5],
                    'table_number': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'updated_at': row[8].isoformat() if row[8] else None
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
                'body': json.dumps({'games': games})
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'Error: {str(e)}'})
            }
    
    elif method == 'POST':
        # Require authentication
        is_valid, user_data, error_msg = verify_token(event)
        if not is_valid:
            return create_auth_error(error_msg or 'Unauthorized')
        
        # Create new games (pairings)
        try:
            body_data = json.loads(event.get('body', '{}'))
            tournament_id = body_data.get('tournament_id')
            round_number = body_data.get('round_number')
            pairings = body_data.get('pairings', [])
            
            if not tournament_id or round_number is None or not pairings:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'tournament_id, round_number and pairings are required'})
                }
            
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            created_games = []
            
            for pairing in pairings:
                player1_id = pairing.get('player1_id')
                player2_id = pairing.get('player2_id')
                table_number = pairing.get('table_number')
                
                if not player1_id:
                    continue
                
                # For BYE matches (player2_id is null), set is_bye flag and auto-win
                is_bye = False
                result_value = None
                if not player2_id:
                    is_bye = True
                    result_value = 'win1'
                    player2_id = None
                
                # Insert game - using parameterized query
                cursor.execute("""
                    INSERT INTO t_p79348767_tournament_site_buil.games 
                    (tournament_id, round_number, player1_id, player2_id, result, table_number, is_bye)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, tournament_id, round_number, player1_id, player2_id, result, table_number, created_at
                """, (tournament_id, round_number, player1_id, player2_id, result_value, table_number, is_bye))
                
                row = cursor.fetchone()
                created_games.append({
                    'id': row[0],
                    'tournament_id': row[1],
                    'round_number': row[2],
                    'player1_id': row[3],
                    'player2_id': row[4],
                    'result': row[5],
                    'table_number': row[6],
                    'created_at': row[7].isoformat() if row[7] else None
                })
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'games': created_games,
                    'message': f'Created {len(created_games)} games'
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
                'body': json.dumps({'error': f'Error: {str(e)}'})
            }
    
    elif method == 'PUT':
        # Require authentication
        is_valid, user_data, error_msg = verify_token(event)
        if not is_valid:
            return create_auth_error(error_msg or 'Unauthorized')
        
        # Update game result
        try:
            body_data = json.loads(event.get('body', '{}'))
            game_id = body_data.get('game_id')
            result = body_data.get('result')
            
            if not game_id or not result:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'game_id and result are required'})
                }
            
            # Validate result
            if result not in ['win1', 'win2', 'draw']:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Invalid result. Must be win1, win2, or draw'})
                }
            
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE t_p79348767_tournament_site_buil.games
                SET result = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, tournament_id, round_number, player1_id, player2_id, result, updated_at
            """, (result, game_id))
            
            row = cursor.fetchone()
            
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
                    'body': json.dumps({'error': 'Game not found'})
                }
            
            updated_game = {
                'id': row[0],
                'tournament_id': row[1],
                'round_number': row[2],
                'player1_id': row[3],
                'player2_id': row[4],
                'result': row[5],
                'updated_at': row[6].isoformat() if row[6] else None
            }
            
            conn.commit()
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
                    'game': updated_game,
                    'message': 'Game result updated'
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
                'body': json.dumps({'error': f'Error: {str(e)}'})
            }
    
    elif method == 'DELETE':
        # Require authentication
        is_valid, user_data, error_msg = verify_token(event)
        if not is_valid:
            return create_auth_error(error_msg or 'Unauthorized')
        
        # Delete games for a specific round
        try:
            # Try to get params from query string first, then from body
            query_params = event.get('queryStringParameters', {}) or {}
            tournament_id = query_params.get('tournament_id')
            round_number = query_params.get('round_number')
            
            # If not in query params, try body
            if not tournament_id or round_number is None:
                body_data = json.loads(event.get('body', '{}'))
                tournament_id = tournament_id or body_data.get('tournament_id')
                round_number = round_number if round_number is not None else body_data.get('round_number')
            
            if not tournament_id or round_number is None:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'tournament_id and round_number are required'})
                }
            
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            # Delete games for the round - parameterized query
            cursor.execute("""
                DELETE FROM t_p79348767_tournament_site_buil.games
                WHERE tournament_id = %s AND round_number = %s
                RETURNING id
            """, (tournament_id, round_number))
            
            deleted_ids = [row[0] for row in cursor.fetchall()]
            
            conn.commit()
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
                    'deleted_count': len(deleted_ids),
                    'deleted_ids': deleted_ids,
                    'message': f'Deleted {len(deleted_ids)} games'
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
                'body': json.dumps({'error': f'Error: {str(e)}'})
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