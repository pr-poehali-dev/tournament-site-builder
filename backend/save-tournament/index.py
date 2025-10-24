import json
import os
import psycopg2
import psycopg2.extensions
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Save tournament data to PostgreSQL database
    Args: event - dict with httpMethod, body containing tournament data
          context - execution context
    Returns: HTTP response dict with created tournament
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    if method not in ['POST', 'PUT']:
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Only POST and PUT methods allowed'})
        }
    
    try:
        body = event.get('body', '{}')
        tournament_data = json.loads(body)
        
        if method == 'PUT':
            tournament_id = tournament_data.get('id')
            
            print(f'🔍 PUT request to update tournament {tournament_id}')
            print(f'📦 Received data: {json.dumps(tournament_data, indent=2)}')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Tournament ID is required'})
                }
            
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
            
            def escape_string(val):
                if val is None:
                    return 'NULL'
                if isinstance(val, bool):
                    return 'TRUE' if val else 'FALSE'
                if isinstance(val, (int, float)):
                    return str(val)
                return "'" + str(val).replace("'", "''") + "'"
            
            update_parts = []
            
            if 'name' in tournament_data:
                update_parts.append(f"name = {escape_string(tournament_data['name'])}")
            
            if 'format' in tournament_data:
                update_parts.append(f"format = {escape_string(tournament_data['format'])}")
            
            if 'date' in tournament_data:
                date_val = tournament_data['date'] if tournament_data['date'] else None
                update_parts.append(f"tournament_date = {escape_string(date_val)}")
            
            if 'city' in tournament_data:
                city_val = tournament_data['city'] if tournament_data['city'] else None
                update_parts.append(f"city = {escape_string(city_val)}")
            
            if 'club' in tournament_data:
                club_val = tournament_data['club'] if tournament_data['club'] else None
                update_parts.append(f"club = {escape_string(club_val)}")
            
            if 'is_rated' in tournament_data:
                update_parts.append(f"is_rated = {escape_string(tournament_data['is_rated'])}")
            
            if 'swiss_rounds' in tournament_data:
                update_parts.append(f"swiss_rounds = {escape_string(tournament_data['swiss_rounds'])}")
            
            if 'top_rounds' in tournament_data:
                top_val = tournament_data['top_rounds'] if tournament_data['top_rounds'] else None
                update_parts.append(f"top_rounds = {escape_string(top_val)}")
            
            if 'participants' in tournament_data:
                participants = tournament_data['participants']
                if participants:
                    participants_str = '{' + ','.join(str(int(p)) for p in participants) + '}'
                else:
                    participants_str = '{}'
                update_parts.append(f"participants = '{participants_str}'::integer[]")
            
            if 'status' in tournament_data:
                update_parts.append(f"status = {escape_string(tournament_data['status'])}")
            
            if 'current_round' in tournament_data:
                update_parts.append(f"current_round = {escape_string(tournament_data['current_round'])}")
            
            if 'judge_id' in tournament_data:
                judge_id = tournament_data['judge_id']
                judge_id_int = None
                if judge_id:
                    try:
                        judge_id_int = int(judge_id)
                    except (ValueError, TypeError):
                        judge_id_int = None
                update_parts.append(f"judge_id = {escape_string(judge_id_int)}")
            
            if 'hasSeating' in tournament_data:
                update_parts.append(f"t_seating = {escape_string(tournament_data['hasSeating'])}")
            
            if 'droppedPlayers' in tournament_data:
                dropped_players = tournament_data['droppedPlayers']
                if dropped_players:
                    dropped_str = '{' + ','.join(str(int(p)) for p in dropped_players) + '}'
                else:
                    dropped_str = '{}'
                update_parts.append(f"dropped_players = '{dropped_str}'::integer[]")
            
            if not update_parts:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'No fields to update'})
                }
            
            query = f"""
                UPDATE t_p79348767_tournament_site_buil.tournaments 
                SET {', '.join(update_parts)}
                WHERE id = {int(tournament_id)}
                RETURNING id, name, status, swiss_rounds, top_rounds, participants
            """
            
            print(f'🔧 Update query: {query}')
            
            cursor.execute(query)
            row = cursor.fetchone()
            conn.commit()
            
            if not row:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Tournament not found'})
                }
            
            print(f'✅ Tournament updated successfully: {row}')
            
            cursor.close()
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
                    'tournament': {
                        'id': row[0],
                        'name': row[1],
                        'status': row[2],
                        'swiss_rounds': row[3],
                        'top_rounds': row[4],
                        'participants': row[5]
                    }
                })
            }
        
        name = tournament_data.get('name')
        tournament_format = tournament_data.get('format')
        tournament_date = tournament_data.get('date')
        city = tournament_data.get('city')
        club = tournament_data.get('club')
        is_rated = tournament_data.get('is_rated', True)
        swiss_rounds = tournament_data.get('swiss_rounds', 3)
        top_rounds = tournament_data.get('top_rounds')
        participants = tournament_data.get('participants', [])
        judge_id = tournament_data.get('judge_id')
        
        if not name or not tournament_format:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Tournament name and format are required'})
            }
        
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
        
        def escape_string(val):
            if val is None:
                return 'NULL'
            if isinstance(val, bool):
                return 'TRUE' if val else 'FALSE'
            if isinstance(val, (int, float)):
                return str(val)
            return "'" + str(val).replace("'", "''") + "'"
        
        name_sql = escape_string(name)
        format_sql = escape_string(tournament_format)
        date_sql = escape_string(tournament_date) if tournament_date else 'NULL'
        city_sql = escape_string(city) if city else 'NULL'
        club_sql = escape_string(club) if club else 'NULL'
        is_rated_sql = 'TRUE' if is_rated else 'FALSE'
        swiss_rounds_sql = str(swiss_rounds)
        top_rounds_sql = escape_string(top_rounds) if top_rounds else 'NULL'
        judge_id_sql = str(int(judge_id)) if judge_id else 'NULL'
        
        if participants:
            participants_sql = "'{" + ','.join(str(int(p)) for p in participants) + "}'::integer[]"
        else:
            participants_sql = "'{}'::integer[]"
        
        query = f"""
            INSERT INTO t_p79348767_tournament_site_buil.tournaments 
            (name, type, format, tournament_date, city, club, is_rated, swiss_rounds, top_rounds, participants, status, current_round, judge_id)
            VALUES ({name_sql}, 'swiss', {format_sql}, {date_sql}, {city_sql}, {club_sql}, {is_rated_sql}, {swiss_rounds_sql}, {top_rounds_sql}, {participants_sql}, 'setup', 1, {judge_id_sql})
            RETURNING id, name, format, tournament_date, city, club, is_rated, swiss_rounds, top_rounds, participants, status
        """
        
        cursor.execute(query)
        row = cursor.fetchone()
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'tournament': {
                    'id': row[0],
                    'name': row[1],
                    'format': row[2],
                    'date': str(row[3]) if row[3] else None,
                    'city': row[4],
                    'club': row[5],
                    'is_rated': row[6],
                    'swiss_rounds': row[7],
                    'top_rounds': row[8],
                    'participants': row[9],
                    'status': row[10]
                }
            })
        }
        
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }