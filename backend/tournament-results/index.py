"""
Business: Save and retrieve tournament final results (player places)
Args: event with httpMethod, body containing results array
Returns: HTTP response with saved results or retrieved results
"""

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

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
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters', {})
            tournament_id = query_params.get('tournament_id')
            
            if tournament_id:
                query = """
                    SELECT tournament_id, player_id, place, points, buchholz, 
                           sum_buchholz, wins, losses, draws, created_at
                    FROM t_p79348767_tournament_site_buil.tournament_results
                    WHERE tournament_id = %s
                    ORDER BY place ASC
                """
                cursor.execute(query, (int(tournament_id),))
            else:
                query = """
                    SELECT tournament_id, player_id, place, points, buchholz,
                           sum_buchholz, wins, losses, draws, created_at
                    FROM t_p79348767_tournament_site_buil.tournament_results
                    ORDER BY tournament_id DESC, place ASC
                """
                cursor.execute(query)
            
            rows = cursor.fetchall()
            results = [dict(row) for row in rows]
            
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
            
            # Delete existing results for this tournament
            if results:
                tournament_id = results[0].get('tournament_id')
                cursor.execute(
                    "DELETE FROM t_p79348767_tournament_site_buil.tournament_results WHERE tournament_id = %s",
                    (tournament_id,)
                )
            
            # Insert new results
            insert_query = """
                INSERT INTO t_p79348767_tournament_site_buil.tournament_results
                (tournament_id, player_id, place, points, buchholz, sum_buchholz, wins, losses, draws)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            for result in results:
                cursor.execute(insert_query, (
                    result.get('tournament_id'),
                    result.get('player_id'),
                    result.get('place'),
                    result.get('points'),
                    result.get('buchholz', 0),
                    result.get('sum_buchholz', 0),
                    result.get('wins', 0),
                    result.get('losses', 0),
                    result.get('draws', 0)
                ))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'saved_count': len(results),
                    'tournament_id': results[0].get('tournament_id') if results else None
                })
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cursor.close()
        conn.close()
