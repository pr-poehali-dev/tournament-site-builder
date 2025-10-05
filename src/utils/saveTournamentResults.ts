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

// Make function available globally with app state access
(window as any).saveTournament26Results = async () => {
  // Get React app root element and try to find the app state
  const appElement = document.querySelector('#root');
  if (!appElement) {
    console.error('Не найден элемент #root');
    return;
  }

  // Access React Fiber to get component instance
  const reactKey = Object.keys(appElement).find(key => 
    key.startsWith('__react') && key.includes('internal')
  );
  
  if (!reactKey) {
    console.error('Не удалось получить доступ к React');
    return;
  }

  // Navigate through React Fiber tree to find appState
  const fiber = (appElement as any)[reactKey];
  let appState = null;
  let users = null;
  
  // Search for appState in component tree
  const searchState = (node: any, depth = 0): boolean => {
    if (depth > 50) return false;
    
    if (node?.memoizedProps) {
      if (node.memoizedProps.appState?.tournaments) {
        appState = node.memoizedProps.appState;
        return true;
      }
      if (node.memoizedProps.tournaments && node.memoizedProps.users) {
        users = node.memoizedProps.users;
        appState = { tournaments: node.memoizedProps.tournaments, users: node.memoizedProps.users };
        return true;
      }
    }
    
    if (node?.child && searchState(node.child, depth + 1)) return true;
    if (node?.sibling && searchState(node.sibling, depth + 1)) return true;
    
    return false;
  };
  
  searchState(fiber);
  
  if (!appState || !appState.tournaments) {
    console.error('Не удалось найти appState с данными турниров');
    console.log('Попробуйте открыть страницу турнира 26 и выполнить команду снова');
    return;
  }
  
  const tournament = appState.tournaments.find((t: any) => t.dbId === 26);
  if (!tournament) {
    console.error('Турнир 26 не найден в appState');
    console.log('Доступные турниры:', appState.tournaments.map((t: any) => ({ id: t.id, dbId: t.dbId, name: t.name })));
    return;
  }
  
  const usersData = appState.users || users || [];
  if (usersData.length === 0) {
    console.error('Не удалось найти данные пользователей');
    return;
  }
  
  const authToken = localStorage.getItem('auth_token') || '';
  
  console.log(`🎯 Найден турнир: ${tournament.name}`);
  console.log(`👥 Участников: ${tournament.participants?.length || 0}`);
  console.log(`🎮 Раундов: ${tournament.rounds?.length || 0}`);
  
  await saveTournamentResultsToDb(tournament, usersData, authToken);
};

console.log('💾 Для сохранения результатов турнира 26 используйте команду:\nsaveTournament26Results()');