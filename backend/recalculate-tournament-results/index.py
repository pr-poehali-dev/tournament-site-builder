'''
Business: Recalculate and save tournament results for a specific tournament
Args: event with httpMethod, queryStringParameters (tournament_id)
Returns: Success message with saved results count
'''

import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def calculate_standings(tournament: Dict[str, Any], users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    dropped_player_ids = set(tournament.get('dropped_player_ids', []))
    participants = tournament.get('participants', [])
    rounds_data = tournament.get('rounds', [])
    swiss_rounds = tournament.get('swiss_rounds', 4)
    
    standings = []
    
    for participant_id in participants:
        user = next((u for u in users if u['id'] == participant_id), None)
        if not user:
            continue
            
        points = 0
        wins = 0
        losses = 0
        draws = 0
        opponent_ids = []
        drop_round_number = None
        
        if participant_id in dropped_player_ids:
            for idx, round_data in enumerate(rounds_data):
                match_found = False
                for match in round_data.get('matches', []):
                    if match.get('player1Id') == participant_id or match.get('player2Id') == participant_id:
                        match_found = True
                        break
                if not match_found and drop_round_number is None:
                    drop_round_number = round_data.get('number')
                    break
        
        for round_data in rounds_data:
            round_number = round_data.get('number', 0)
            if round_number <= swiss_rounds:
                if drop_round_number is not None and round_number >= drop_round_number:
                    continue
                    
                match = None
                for m in round_data.get('matches', []):
                    if m.get('player1Id') == participant_id or m.get('player2Id') == participant_id:
                        match = m
                        break
                
                if match:
                    if not match.get('player2Id'):
                        points += 3
                        wins += 1
                    else:
                        opponent_id = match.get('player2Id') if match.get('player1Id') == participant_id else match.get('player1Id')
                        opponent_ids.append(opponent_id)
                        
                        result = match.get('result')
                        if result == 'player1':
                            if match.get('player1Id') == participant_id:
                                points += 3
                                wins += 1
                            else:
                                losses += 1
                        elif result == 'player2':
                            if match.get('player2Id') == participant_id:
                                points += 3
                                wins += 1
                            else:
                                losses += 1
                        elif result == 'draw':
                            points += 1
                            draws += 1
        
        standings.append({
            'user': user,
            'participant_id': participant_id,
            'points': points,
            'wins': wins,
            'losses': losses,
            'draws': draws,
            'opponent_ids': opponent_ids
        })
    
    opponent_points_map = {s['participant_id']: s['points'] for s in standings}
    
    for standing in standings:
        buchholz = sum(opponent_points_map.get(opp_id, 0) for opp_id in standing['opponent_ids'])
        standing['buchholz'] = buchholz
    
    opponent_buchholz_map = {s['participant_id']: s['buchholz'] for s in standings}
    
    for standing in standings:
        sum_buchholz = sum(opponent_buchholz_map.get(opp_id, 0) for opp_id in standing['opponent_ids'])
        standing['sum_buchholz'] = sum_buchholz
    
    standings.sort(key=lambda x: (-x['points'], -x['buchholz'], -x['sum_buchholz']))
    
    return standings

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    params = event.get('queryStringParameters', {}) or {}
    tournament_id = params.get('tournament_id')
    
    if not tournament_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'tournament_id required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute('SELECT * FROM tournaments WHERE id = %s', (tournament_id,))
    tournament = cursor.fetchone()
    
    if not tournament:
        cursor.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Tournament not found'})
        }
    
    cursor.execute('SELECT * FROM users')
    users = cursor.fetchall()
    
    tournament_dict = dict(tournament)
    users_list = [dict(u) for u in users]
    
    standings = calculate_standings(tournament_dict, users_list)
    
    cursor.execute('DELETE FROM tournament_results WHERE tournament_id = %s', (tournament_id,))
    
    for idx, standing in enumerate(standings):
        cursor.execute('''
            INSERT INTO tournament_results 
            (tournament_id, player_id, place, points, buchholz, sum_buchholz, wins, losses, draws)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            int(tournament_id),
            standing['participant_id'],
            idx + 1,
            standing['points'],
            standing['buchholz'],
            standing['sum_buchholz'],
            standing['wins'],
            standing['losses'],
            standing['draws']
        ))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'tournament_id': int(tournament_id),
            'results_saved': len(standings)
        })
    }
