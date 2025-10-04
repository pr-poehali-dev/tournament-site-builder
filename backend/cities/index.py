import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление городами - получение списка, добавление, изменение и удаление
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с request_id и другими атрибутами
    Returns: HTTP response dict с списком городов или результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute('SELECT id, name, created_at FROM cities ORDER BY name')
            rows = cur.fetchall()
            cities = [{'id': str(row[0]), 'name': row[1], 'created_at': row[2].isoformat() if row[2] else None} for row in rows]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'cities': cities})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name', '').strip()
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'City name is required'})
                }
            
            cur.execute('SELECT id FROM cities WHERE name = %s', (name,))
            existing = cur.fetchone()
            if existing:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'id': str(existing[0]), 'name': name, 'existing': True})
                }
            
            cur.execute('INSERT INTO cities (name) VALUES (%s) RETURNING id', (name,))
            city_id = cur.fetchone()[0]
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'id': str(city_id), 'name': name})
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            city_id = body_data.get('id')
            name = body_data.get('name', '').strip()
            
            if not city_id or not name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'City id and name are required'})
                }
            
            cur.execute('UPDATE cities SET name = %s WHERE id = %s', (name, int(city_id)))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'id': city_id, 'name': name})
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            city_id = params.get('id')
            
            if not city_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'City id is required'})
                }
            
            cur.execute('DELETE FROM cities WHERE id = %s', (int(city_id),))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()