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
    Business: API for tournament management - create tournaments, add players, record games
    Args: event - dict with httpMethod, body, queryStringParameters, pathParams
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict with tournament data
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
            # Get all tournaments
            cursor.execute("""
                SELECT id, name, type, status, current_round, max_rounds, created_at
                FROM tournaments
                ORDER BY created_at DESC
            """)
            
            tournaments = []
            for row in cursor.fetchall():
                tournaments.append({
                    'id': row[0],
                    'name': row[1],
                    'type': row[2],
                    'status': row[3],
                    'current_round': row[4],
                    'max_rounds': row[5],
                    'created_at': row[6].isoformat() if row[6] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'tournaments': tournaments})
            }
        
        elif method == 'POST':
            # Create new tournament
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name', '').strip()
            tournament_type = body_data.get('type', 'top')
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tournament name is required'})
                }
            
            cursor.execute("""
                INSERT INTO tournaments (name, type, status)
                VALUES (%s, %s, 'setup')
                RETURNING id, name, type, status, current_round, max_rounds, created_at
            """, (name, tournament_type))
            
            row = cursor.fetchone()
            conn.commit()
            
            tournament = {
                'id': row[0],
                'name': row[1],
                'type': row[2],
                'status': row[3],
                'current_round': row[4],
                'max_rounds': row[5],
                'created_at': row[6].isoformat() if row[6] else None
            }
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'tournament': tournament})
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