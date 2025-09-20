import json
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Tournament API - mock version for testing
    Args: event - dict with httpMethod, body 
          context - object with request_id
    Returns: HTTP response dict
    '''
    method = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    if method == 'GET':
        # Return mock tournaments
        tournaments = [
            {
                'id': 1,
                'name': 'Тестовый турнир',
                'type': 'top',
                'status': 'setup',
                'current_round': 0,
                'max_rounds': 4,
                'created_at': '2025-09-20T18:50:00.000Z'
            }
        ]
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'tournaments': tournaments})
        }
    
    elif method == 'POST':
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