"""
Business: Save and retrieve tournament final results (player places)
Args: event with httpMethod, body containing results array
Returns: HTTP response with saved results or retrieved results
"""

import json
import os
from typing import Dict, Any
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn: str = os.environ.get('DATABASE_URL', '')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'})
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters', {})
            tournament_id = query_params.get('tournament_id')
            
            if tournament_id:
                query = f"""
                    SELECT tournament_id, player_id, place, points, buchholz, 
                           sum_buchholz, wins, losses, draws, created_at
                    FROM t_p79348767_tournament_site_buil.tournament_results
                    WHERE tournament_id = {int(tournament_id)}
                    ORDER BY place ASC
                """
            else:
                query = """
                    SELECT tournament_id, player_id, place, points, buchholz,
                           sum_buchholz, wins, losses, draws, created_at
                    FROM t_p79348767_tournament_site_buil.tournament_results
                    ORDER BY tournament_id DESC, place ASC
                """
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                result_dict = {
                    'tournament_id': row[0],
                    'player_id': row[1],
                    'place': row[2],
                    'points': row[3],
                    'buchholz': row[4],
                    'sum_buchholz': row[5],
                    'wins': row[6],
                    'losses': row[7],
                    'draws': row[8],
                    'created_at': row[9].isoformat() if row[9] else None
                }
                results.append(result_dict)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'results': results})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            results = body_data.get('results', [])
            
            if not results:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No results provided'})
                }
            
            tournament_id = results[0].get('tournament_id')
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tournament_id is required'})
                }
            
            delete_query = f"DELETE FROM t_p79348767_tournament_site_buil.tournament_results WHERE tournament_id = {int(tournament_id)}"
            cursor.execute(delete_query)
            
            for result in results:
                def escape_val(val):
                    if val is None:
                        return 'NULL'
                    if isinstance(val, (int, float)):
                        return str(val)
                    return "'" + str(val).replace("'", "''") + "'"
                
                insert_query = f"""
                    INSERT INTO t_p79348767_tournament_site_buil.tournament_results
                    (tournament_id, player_id, place, points, buchholz, sum_buchholz, wins, losses, draws)
                    VALUES (
                        {int(result.get('tournament_id'))},
                        {int(result.get('player_id'))},
                        {int(result.get('place'))},
                        {int(result.get('points', 0))},
                        {int(result.get('buchholz', 0))},
                        {int(result.get('sum_buchholz', 0))},
                        {int(result.get('wins', 0))},
                        {int(result.get('losses', 0))},
                        {int(result.get('draws', 0))}
                    )
                """
                cursor.execute(insert_query)
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'saved_count': len(results),
                    'tournament_id': tournament_id
                })
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        cursor.close()
        conn.close()
