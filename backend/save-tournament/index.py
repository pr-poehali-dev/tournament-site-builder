import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Save tournament to database
    Args: event - dict with httpMethod, body containing tournament data
          context - execution context
    Returns: HTTP response dict
    '''
    method = event.get('httpMethod', 'POST')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
            'body': json.dumps({'error': 'Only POST method allowed'})
        }
    
    try:
        # Parse tournament data
        body = event.get('body', '{}')
        tournament_data = json.loads(body)
        
        name = tournament_data.get('name', '').strip()
        tournament_format = tournament_data.get('format', 'sealed')
        city = tournament_data.get('city', '')
        date = tournament_data.get('date', '')
        swiss_rounds = tournament_data.get('swissRounds', 3)
        top_rounds = tournament_data.get('topRounds', 0)
        
        # Determine tournament type based on rounds structure
        # If has TOP rounds - type is 'top', otherwise 'swiss'
        tournament_type = 'top' if top_rounds > 0 else 'swiss'
        
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
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Insert tournament into database (using simple query protocol)
        escaped_name = name.replace("'", "''")
        
        cursor.execute(f"""
            INSERT INTO t_p79348767_tournament_site_buil.tournaments 
            (name, type, status, current_round, max_rounds) 
            VALUES ('{escaped_name}', '{tournament_type}', 'setup', 0, NULL)
            RETURNING id, name, type, status, current_round, max_rounds, created_at
        """)
        
        row = cursor.fetchone()
        conn.commit()
        
        # Format response
        saved_tournament = {
            'id': row[0],
            'name': row[1],
            'type': row[2],
            'status': row[3],
            'current_round': row[4],
            'max_rounds': row[5],
            'created_at': row[6].isoformat() if row[6] else None,
            'db_saved': True
        }
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'tournament': saved_tournament,
                'message': 'Tournament saved to database successfully'
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
            'body': json.dumps({
                'error': f'Database error: {str(e)}',
                'success': False
            })
        }
    except json.JSONDecodeError as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'error': f'Invalid JSON: {str(e)}',
                'success': False
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
            'body': json.dumps({
                'error': f'Unexpected error: {str(e)}',
                'success': False
            })
        }
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()