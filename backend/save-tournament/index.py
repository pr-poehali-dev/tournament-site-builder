import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Save tournament data to PostgreSQL database
    Args: event - dict with httpMethod, body containing tournament data
          context - execution context
    Returns: HTTP response dict with created tournament
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
        is_rated = tournament_data.get('isRated', True)
        judge_id = tournament_data.get('judgeId')
        participants = tournament_data.get('participants', [])
        
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
        escaped_city = city.replace("'", "''") if city else ''
        escaped_format = tournament_format.replace("'", "''")
        
        # Convert participants list to PostgreSQL array format
        participants_array = '{' + ','.join(str(p) for p in participants) + '}' if participants else '{}'
        
        # Build judge_id part - convert string ID to integer
        if judge_id:
            try:
                # Remove any non-numeric characters and convert to int
                judge_id_clean = ''.join(filter(str.isdigit, str(judge_id)))
                judge_id_value = judge_id_clean if judge_id_clean else 'NULL'
            except:
                judge_id_value = 'NULL'
        else:
            judge_id_value = 'NULL'
        
        # Temporary: set type based on top_rounds until column is removed
        tournament_type = 'top' if top_rounds and top_rounds > 0 else 'swiss'
        
        cursor.execute(f"""
            INSERT INTO t_p79348767_tournament_site_buil.tournaments 
            (name, type, format, status, current_round, swiss_rounds, top_rounds, city, is_rated, judge_id, participants) 
            VALUES (
                '{escaped_name}',
                '{tournament_type}',
                '{escaped_format}',
                'setup',
                0,
                {swiss_rounds},
                {top_rounds if top_rounds else 'NULL'},
                {'NULL' if not city else f"'{escaped_city}'"},
                {str(is_rated).lower()},
                {judge_id_value},
                '{participants_array}'::integer[]
            )
            RETURNING id, name, format, status, swiss_rounds, top_rounds, created_at, city, is_rated, judge_id, participants
        """)
        
        row = cursor.fetchone()
        conn.commit()
        
        # Format response
        saved_tournament = {
            'id': row[0],
            'name': row[1],
            'format': row[2],
            'status': row[3],
            'swiss_rounds': row[4],
            'top_rounds': row[5],
            'created_at': row[6].isoformat() if row[6] else None,
            'city': row[7],
            'is_rated': row[8],
            'judge_id': row[9],
            'participants': row[10] if row[10] else [],
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
