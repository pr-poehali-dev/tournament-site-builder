import React from 'react';
import { useAppState } from '@/hooks/useAppState';
import { Button } from '@/components/ui/button';

// Example component showing how to use the useAppState hook
export const UseAppStateExample: React.FC = () => {
  const {
    appState,
    navigateTo,
    showLoginForm,
    addPlayer,
    addCity,
    addTournament,
    updateMatchResult,
    finishTournament
  } = useAppState();

  const handleAddExamplePlayer = () => {
    addPlayer({
      id: `player-${Date.now()}`,
      name: 'Новый игрок',
      city: 'Рязань',
      rating: 1200,
      tournaments: 0,
      wins: 0,
      losses: 0,
      draws: 0
    });
  };

  const handleAddExampleCity = () => {
    addCity({
      id: `city-${Date.now()}`,
      name: 'Новый город'
    });
  };

  const handleAddExampleTournament = () => {
    addTournament({
      id: `tournament-${Date.now()}`,
      name: 'Тестовый турнир',
      date: '2024-12-01',
      city: 'Рязань',
      format: 'Драфт',
      description: 'Тестовый турнир для примера',
      isRated: true,
      swissRounds: 3,
      topRounds: 1,
      participants: appState.players.slice(0, 4).map(p => p.id),
      status: 'draft',
      rounds: [],
      currentRound: 0
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Пример использования useAppState</h2>
      
      <div className="space-y-2">
        <p>Текущая страница: {appState.currentPage}</p>
        <p>Пользователь: {appState.currentUser?.name || 'Не авторизован'}</p>
        <p>Игроков: {appState.players.length}</p>
        <p>Городов: {appState.cities.length}</p>
        <p>Турниров: {appState.tournaments.length}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => navigateTo('rating')}>
          К рейтингу
        </Button>
        <Button onClick={() => navigateTo('tournaments')}>
          К турнирам
        </Button>
        <Button onClick={showLoginForm}>
          Показать форму входа
        </Button>
        <Button onClick={handleAddExamplePlayer}>
          Добавить игрока
        </Button>
        <Button onClick={handleAddExampleCity}>
          Добавить город
        </Button>
        <Button onClick={handleAddExampleTournament}>
          Добавить турнир
        </Button>
      </div>

      {/* Показать список игроков */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Игроки:</h3>
        <ul className="space-y-1">
          {appState.players.map(player => (
            <li key={player.id} className="p-2 border rounded">
              {player.name} - {player.city} (Рейтинг: {player.rating})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};