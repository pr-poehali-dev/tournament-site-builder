import json
import os
import psycopg2
from typing import Dict, Any, List, Tuple
from collections import defaultdict

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Recalculate Elo ratings for all tournament games and update rating changes in database
    Args: event - dict with httpMethod, body containing tournament_id
          context - execution context
    Returns: HTTP response dict with updated games count
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
        # Parse request
        body = event.get('body', '{}')
        data = json.loads(body)
        tournament_id = data.get('tournament_id')
        
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
        
        # Get all games for the tournament ordered by round
        cursor.execute(f"""
            SELECT id, round_number, player1_id, player2_id, result, is_bye
            FROM t_p79348767_tournament_site_buil.games
            WHERE tournament_id = {tournament_id}
            ORDER BY round_number, id
        """)
        
        games = cursor.fetchall()
        
        if not games:
            cursor.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'No games found for this tournament'})
            }
        
        # Get initial ratings for all players
        player_ids = set()
        for game in games:
            player_ids.add(game[2])  # player1_id
            if game[3]:  # player2_id
                player_ids.add(game[3])
        
        player_ids_str = ','.join(str(pid) for pid in player_ids)
        cursor.execute(f"""
            SELECT id, rating
            FROM t_p79348767_tournament_site_buil.users
            WHERE id IN ({player_ids_str})
        """)
        
        # Initialize ratings (use current rating as starting point, or 1200 default)
        current_ratings = {}
        for row in cursor.fetchall():
            current_ratings[row[0]] = row[1] if row[1] else 1200
        
        # Calculate Elo rating changes
        def calculate_elo_change(player_rating: int, opponent_rating: int, result: float, k_factor: int = 32) -> int:
            expected_score = 1.0 / (1.0 + pow(10, (opponent_rating - player_rating) / 400.0))
            return round(k_factor * (result - expected_score))
        
        # Process games round by round
        updates: List[Tuple[int, int, int]] = []
        
        for game in games:
            game_id, round_num, p1_id, p2_id, result, is_bye = game
            
            if is_bye or not p2_id:
                # Bye - no rating change
                updates.append((game_id, 0, 0))
            else:
                p1_rating = current_ratings.get(p1_id, 1200)
                p2_rating = current_ratings.get(p2_id, 1200)
                
                # Determine results (1 = win, 0.5 = draw, 0 = loss)
                if result == 'win1':
                    p1_result = 1.0
                    p2_result = 0.0
                elif result == 'win2':
                    p1_result = 0.0
                    p2_result = 1.0
                elif result == 'draw':
                    p1_result = 0.5
                    p2_result = 0.5
                else:
                    # No result yet
                    updates.append((game_id, 0, 0))
                    continue
                
                # Calculate rating changes
                p1_change = calculate_elo_change(p1_rating, p2_rating, p1_result)
                p2_change = calculate_elo_change(p2_rating, p1_rating, p2_result)
                
                # Update current ratings for next round
                current_ratings[p1_id] = p1_rating + p1_change
                current_ratings[p2_id] = p2_rating + p2_change
                
                updates.append((game_id, p1_change, p2_change))
        
        # Update all games with rating changes
        for game_id, p1_change, p2_change in updates:
            cursor.execute(f"""
                UPDATE t_p79348767_tournament_site_buil.games
                SET player1_rating_change = {p1_change},
                    player2_rating_change = {p2_change}
                WHERE id = {game_id}
            """)
        
        conn.commit()
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
                'updated_games': len(updates),
                'message': f'Successfully recalculated ratings for {len(updates)} games'
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
