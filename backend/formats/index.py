import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление форматами турниров - получение, добавление, изменение и удаление
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с request_id и другими атрибутами
    Returns: HTTP response dict с списком форматов или результатом операции
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
            cur.execute('SELECT id, name, coefficient, created_at FROM tournament_formats ORDER BY name')
            rows = cur.fetchall()
            formats = [{'id': str(row[0]), 'name': row[1], 'coefficient': float(row[2]), 'created_at': row[3].isoformat() if row[3] else None} for row in rows]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'formats': formats})
            }
        
        elif method == 'POST':
            headers = event.get('headers', {})
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Missing authentication token', 'success': False})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name', '').strip()
            coefficient = body_data.get('coefficient', 1.0)
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Format name is required'})
                }
            
            escaped_name = name.replace("'", "''")
            cur.execute(f"SELECT id FROM tournament_formats WHERE name = '{escaped_name}'")
            existing = cur.fetchone()
            if existing:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'id': str(existing[0]), 'name': name, 'coefficient': coefficient, 'existing': True})
                }
            
            cur.execute(f"INSERT INTO tournament_formats (name, coefficient) VALUES ('{escaped_name}', {coefficient}) RETURNING id")
            format_id = cur.fetchone()[0]
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'id': str(format_id), 'name': name, 'coefficient': coefficient})
            }
        
        elif method == 'PUT':
            headers = event.get('headers', {})
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Missing authentication token', 'success': False})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            format_id = body_data.get('id')
            name = body_data.get('name', '').strip()
            coefficient = body_data.get('coefficient', 1.0)
            
            if not format_id or not name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Format id and name are required'})
                }
            
            escaped_name = name.replace("'", "''")
            cur.execute(f"UPDATE tournament_formats SET name = '{escaped_name}', coefficient = {coefficient} WHERE id = {int(format_id)}")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'id': format_id, 'name': name, 'coefficient': coefficient})
            }
        
        elif method == 'DELETE':
            headers = event.get('headers', {})
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Missing authentication token', 'success': False})
                }
            
            params = event.get('queryStringParameters', {})
            format_id = params.get('id')
            
            if not format_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Format id is required'})
                }
            
            cur.execute(f'DELETE FROM tournament_formats WHERE id = {int(format_id)}')
            
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