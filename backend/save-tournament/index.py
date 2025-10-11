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
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
        # Parse tournament data
        body = event.get('body', '{}')
        tournament_data = json.loads(body)
        
        # Handle PUT request for updating tournament
        if method == 'PUT':
            tournament_id = tournament_data.get('id')
            
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
            
            # Build dynamic UPDATE query based on provided fields
            update_fields = []
            update_values = []
            
            # Check for all possible fields that can be updated
            if 'name' in tournament_data:
                update_fields.append('name = %s')
                update_values.append(tournament_data['name'])
            
            if 'format' in tournament_data:
                update_fields.append('format = %s')
                update_values.append(tournament_data['format'])
            
            if 'date' in tournament_data:
                update_fields.append('tournament_date = %s')
                update_values.append(tournament_data['date'] if tournament_data['date'] else None)
            
            if 'city' in tournament_data:
                update_fields.append('city = %s')
                update_values.append(tournament_data['city'] if tournament_data['city'] else None)
            
            if 'club' in tournament_data:
                update_fields.append('club = %s')
                update_values.append(tournament_data['club'] if tournament_data['club'] else None)
            
            if 'is_rated' in tournament_data:
                update_fields.append('is_rated = %s')
                update_values.append(tournament_data['is_rated'])
            
            if 'swiss_rounds' in tournament_data:
                update_fields.append('swiss_rounds = %s')
                update_values.append(tournament_data['swiss_rounds'])
            
            if 'top_rounds' in tournament_data:
                update_fields.append('top_rounds = %s')
                update_values.append(tournament_data['top_rounds'] if tournament_data['top_rounds'] else None)
            
            if 'participants' in tournament_data:
                participants = tournament_data['participants']
                if participants:
                    participants_str = '{' + ','.join(str(int(p)) for p in participants) + '}'
                else:
                    participants_str = '{}'
                update_fields.append('participants = %s::integer[]')
                update_values.append(participants_str)
            
            if 'status' in tournament_data:
                update_fields.append('status = %s')
                update_values.append(tournament_data['status'])
            
            if 'current_round' in tournament_data:
                update_fields.append('current_round = %s')
                update_values.append(tournament_data['current_round'])
            
            if 'judge_id' in tournament_data:
                judge_id = tournament_data['judge_id']
                judge_id_int = None
                if judge_id:
                    try:
                        judge_id_int = int(judge_id)
                    except (ValueError, TypeError):
                        judge_id_int = None
                update_fields.append('judge_id = %s')
                update_values.append(judge_id_int)
            
            if 'hasSeating' in tournament_data:
                update_fields.append('t_seating = %s')
                update_values.append(tournament_data['hasSeating'])
            
            if 'droppedPlayers' in tournament_data:
                dropped_players = tournament_data['droppedPlayers']
                if dropped_players:
                    dropped_str = '{' + ','.join(str(int(p)) for p in dropped_players) + '}'
                else:
                    dropped_str = '{}'
                update_fields.append('dropped_players = %s::integer[]')
                update_values.append(dropped_str)
            
            if not update_fields:
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
            
            update_values.append(tournament_id)
            query = f"""
                UPDATE t_p79348767_tournament_site_buil.tournaments 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, status, dropped_players
            """
            
            cursor.execute(query, tuple(update_values))
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
                        'status': row[1],
                        'droppedPlayers': row[2] if row[2] else []
                    }
                })
            }
        
        # Handle POST request for creating tournament
        name = tournament_data.get('name', '').strip()
        tournament_format = tournament_data.get('format', 'sealed')
        city = tournament_data.get('city', '')
        club = tournament_data.get('club')
        date = tournament_data.get('date', '')
        swiss_rounds = tournament_data.get('swissRounds', 3)
        top_rounds = tournament_data.get('topRounds', 0)
        is_rated = tournament_data.get('isRated', True)
        judge_id = tournament_data.get('judgeId')
        participants = tournament_data.get('participants', [])
        t_seating = tournament_data.get('tSeating', False)
        
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
        
        # Insert tournament into database using parameterized query
        # Temporary: set type based on top_rounds until column is removed
        tournament_type = 'top' if top_rounds and top_rounds > 0 else 'swiss'
        
        # Convert judge_id to integer if needed
        judge_id_int = None
        if judge_id:
            try:
                judge_id_int = int(judge_id)
            except (ValueError, TypeError):
                judge_id_int = None
        
        # Convert participants to integer array for PostgreSQL
        # Build array manually as a string to avoid type conversion issues
        if participants:
            participants_str = '{' + ','.join(str(int(p)) for p in participants) + '}'
        else:
            participants_str = '{}'
        
        cursor.execute("""
            INSERT INTO t_p79348767_tournament_site_buil.tournaments 
            (name, type, format, status, current_round, swiss_rounds, top_rounds, city, club, tournament_date, is_rated, judge_id, participants, t_seating, dropped_players) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::integer[], %s, %s::integer[])
            RETURNING id, name, format, status, swiss_rounds, top_rounds, created_at, city, club, tournament_date, is_rated, judge_id, participants, t_seating, dropped_players
        """, (name, tournament_type, tournament_format, 'setup', 0, swiss_rounds, 
              top_rounds if top_rounds else None, city if city else None, club if club else None, 
              date if date else None, is_rated, judge_id_int, participants_str, t_seating, '{}'))
        
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
            'club': row[8],
            'tournament_date': row[9].isoformat() if row[9] else None,
            'is_rated': row[10],
            'judge_id': row[11],
            'participants': row[12] if row[12] else [],
            't_seating': row[13],
            'droppedPlayers': row[14] if row[14] else [],
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