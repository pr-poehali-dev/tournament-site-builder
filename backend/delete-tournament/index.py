'''
Business: Удаление турнира и всех его парингов (для администраторов и судей турнира)
Args: event - dict с httpMethod, queryStringParameters (id) или body (tournament_id), headers (X-User-Id)
      context - object с атрибутами request_id, function_name
Returns: HTTP response dict с результатом удаления
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    print(f'🔍 DELETE tournament request: method={method}')
    print(f'📋 Headers: {event.get("headers", {})}')
    print(f'📋 Query params: {event.get("queryStringParameters", {})}')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'DELETE':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Получаем user_id из заголовков
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    print(f'👤 User ID from headers: {user_id}')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    # Получаем tournament_id из query параметров или body
    query_params = event.get('queryStringParameters', {}) or {}
    tournament_id = query_params.get('id')
    
    if not tournament_id:
        # Пробуем получить из body
        body_str = event.get('body', '{}')
        if body_str:
            body_data = json.loads(body_str)
            tournament_id = body_data.get('tournament_id')
    
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
    
    # Подключение к БД
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # Проверка прав пользователя (администратор или судья турнира)
    cur.execute(
        f"SELECT role FROM t_p79348767_tournament_site_buil.users WHERE id = {user_id}"
    )
    result = cur.fetchone()
    
    if not result:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'User not found'})
        }
    
    user_role = result[0]
    
    # Если не админ, проверяем что пользователь - судья этого турнира
    if user_role != 'admin':
        cur.execute(
            f"SELECT judge_id FROM t_p79348767_tournament_site_buil.tournaments WHERE id = {tournament_id}"
        )
        tournament_result = cur.fetchone()
        
        if not tournament_result or tournament_result[0] != int(user_id):
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Only tournament judge or administrator can delete this tournament'})
            }
    
    # Удаление результатов турнира
    cur.execute(
        f"DELETE FROM t_p79348767_tournament_site_buil.tournament_results WHERE tournament_id = {tournament_id}"
    )
    print(f'✅ Deleted tournament_results for tournament {tournament_id}')
    
    # Удаление парингов турнира
    cur.execute(
        f"DELETE FROM t_p79348767_tournament_site_buil.games WHERE tournament_id = {tournament_id}"
    )
    print(f'✅ Deleted games for tournament {tournament_id}')
    
    # Удаление игроков турнира
    cur.execute(
        f"DELETE FROM t_p79348767_tournament_site_buil.players WHERE tournament_id = {tournament_id}"
    )
    print(f'✅ Deleted players for tournament {tournament_id}')
    
    # Удаление турнира
    cur.execute(
        f"DELETE FROM t_p79348767_tournament_site_buil.tournaments WHERE id = {tournament_id}"
    )
    print(f'✅ Deleted tournament {tournament_id}')
    
    conn.commit()
    cur.close()
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
            'message': f'Tournament {tournament_id} and all its games deleted successfully'
        })
    }