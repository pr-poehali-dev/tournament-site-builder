import { Tournament, User } from '@/types';
import { calculateTournamentStandings } from './tournamentHelpers';

export async function saveTournamentResultsToDb(
  tournament: Tournament,
  users: User[],
  authToken: string
): Promise<void> {
  if (!tournament.dbId) {
    console.error('Tournament has no dbId');
    return;
  }

  const standings = calculateTournamentStandings(tournament, users);
  
  const resultsToSave = standings.map((standing, index) => ({
    tournament_id: tournament.dbId,
    player_id: standing.user.id,
    place: index + 1,
    points: standing.points,
    buchholz: standing.buchholz,
    sum_buchholz: standing.sumBuchholz || 0,
    wins: standing.wins,
    losses: standing.losses,
    draws: standing.draws
  }));

  try {
    const response = await fetch('https://functions.poehali.dev/14e205c3-5a13-45c5-a7ab-d2b8ed973b65', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken
      },
      body: JSON.stringify({ results: resultsToSave })
    });

    if (response.ok) {
      console.log('✅ Результаты турнира сохранены в БД');
    } else {
      const error = await response.text();
      console.error('❌ Ошибка сохранения результатов турнира:', error);
    }
  } catch (error) {
    console.error('⚠️ Не удалось сохранить результаты турнира:', error);
  }
}

// For browser console usage
(window as any).saveTournamentResults = async (tournamentId: number) => {
  try {
    const authToken = localStorage.getItem('auth_token') || '';
    
    // Load tournament data
    const tournamentResponse = await fetch(`https://functions.poehali.dev/a47dbb08-55f7-4ce5-9e38-0d8bb9e7bdd1/${tournamentId}`);
    if (!tournamentResponse.ok) {
      console.error(`Tournament ${tournamentId} not found`);
      return;
    }
    const tournament = await tournamentResponse.json();
    
    // Load users
    const usersResponse = await fetch('https://functions.poehali.dev/e4bf1ae6-dbd0-4de9-b95d-99e6ad5b2b4a');
    if (!usersResponse.ok) {
      console.error('Failed to load users');
      return;
    }
    const users = await usersResponse.json();
    
    await saveTournamentResultsToDb(tournament, users, authToken);
  } catch (error) {
    console.error('Error saving tournament results:', error);
  }
};

console.log('💾 Для сохранения результатов турнира используйте: saveTournamentResults(26)');