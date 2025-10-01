import json
import os
import psycopg2
from typing import Dict, Any

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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    if method == 'GET':
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
                       created_at, updated_at, city, is_rated, judge_id, participants
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
                    'participants': row[11] if row[11] else []
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