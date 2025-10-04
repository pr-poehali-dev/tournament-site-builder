'''
Business: Удаление турнира и всех его парингов (только для администраторов)
Args: event - dict с httpMethod, body (tournament_id), headers (X-User-Id)
      context - object с атрибутами request_id, function_name
Returns: HTTP response dict с результатом удаления
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
    
    # Получаем tournament_id из body
    body_str = event.get('body', '{}')
    if body_str:
        body_data = json.loads(body_str)
    else:
        body_data = {}
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
    
    # Проверка что пользователь - администратор
    cur.execute(
        f"SELECT role FROM t_p79348767_tournament_site_buil.users WHERE id = {user_id}"
    )
    result = cur.fetchone()
    
    if not result or result[0] != 'admin':
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Only administrators can delete tournaments'})
        }
    
    # Удаление парингов турнира
    cur.execute(
        f"DELETE FROM t_p79348767_tournament_site_buil.games WHERE tournament_id = {tournament_id}"
    )
    
    # Удаление турнира
    cur.execute(
        f"DELETE FROM t_p79348767_tournament_site_buil.tournaments WHERE id = {tournament_id}"
    )
    
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