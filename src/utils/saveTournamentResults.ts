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
  const appStateStr = localStorage.getItem('tournamentAppState');
  if (!appStateStr) {
    console.error('AppState not found in localStorage');
    return;
  }

  const appState = JSON.parse(appStateStr);
  const tournament = appState.tournaments.find((t: any) => t.dbId === tournamentId);
  
  if (!tournament) {
    console.error(`Tournament ${tournamentId} not found`);
    return;
  }

  const authToken = localStorage.getItem('authToken') || '';
  await saveTournamentResultsToDb(tournament, appState.users, authToken);
};

console.log('💾 Для сохранения результатов турнира используйте: saveTournamentResults(26)');
