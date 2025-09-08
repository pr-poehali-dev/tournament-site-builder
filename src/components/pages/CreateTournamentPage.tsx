import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { AppState, Tournament, Page } from '@/types';

interface CreateTournamentPageProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
  addTournament: (tournament: Tournament) => void;
  tournamentNameInputRef: React.RefObject<HTMLInputElement>;
  tournamentDateInputRef: React.RefObject<HTMLInputElement>;
  tournamentCitySelectRef: React.RefObject<HTMLSelectElement>;
  tournamentFormatSelectRef: React.RefObject<HTMLSelectElement>;
  tournamentIsRatedInputRef: React.RefObject<HTMLInputElement>;
  tournamentSwissRoundsInputRef: React.RefObject<HTMLInputElement>;
  tournamentTopRoundsInputRef: React.RefObject<HTMLInputElement>;
}

export const CreateTournamentPage: React.FC<CreateTournamentPageProps> = React.memo(({
  appState,
  navigateTo,
  addTournament,
  tournamentNameInputRef,
  tournamentDateInputRef,
  tournamentCitySelectRef,
  tournamentFormatSelectRef,
  tournamentIsRatedInputRef,
  tournamentSwissRoundsInputRef,
  tournamentTopRoundsInputRef
}) => {
  const handleTournamentSubmit = () => {
    const tournamentName = tournamentNameInputRef.current?.value?.trim() || '';
    const tournamentDate = tournamentDateInputRef.current?.value?.trim() || '';
    const tournamentCity = tournamentCitySelectRef.current?.value?.trim() || '';
    const tournamentFormat = tournamentFormatSelectRef.current?.value?.trim() || '';
    const tournamentIsRated = tournamentIsRatedInputRef.current?.checked ?? true;
    const tournamentSwissRounds = Math.max(1, Math.min(8, parseInt(tournamentSwissRoundsInputRef.current?.value || '3') || 3));
    const tournamentTopRounds = Math.max(0, parseInt(tournamentTopRoundsInputRef.current?.value || '0') || 0);
    
    if (!tournamentName) {
      alert('Введите название турнира');
      return;
    }
    if (!tournamentDate) {
      alert('Выберите дату турнира');
      return;
    }
    if (!tournamentCity) {
      alert('Выберите город');
      return;
    }
    if (!tournamentFormat) {
      alert('Выберите формат');
      return;
    }
    // Считываем отмеченных участников из checkbox'ов
    const selectedParticipants: string[] = [];
    appState.players.forEach(player => {
      const checkbox = document.getElementById(`player-${player.id}`) as HTMLInputElement;
      if (checkbox && checkbox.checked) {
        selectedParticipants.push(player.id);
      }
    });

    if (selectedParticipants.length === 0) {
      alert('Добавьте хотя бы одного участника');
      return;
    }

    const tournament: Tournament = {
      id: Date.now().toString(),
      name: tournamentName,
      date: tournamentDate,
      city: tournamentCity,
      format: tournamentFormat,
      description: `Турнир по формату ${tournamentFormat} в городе ${tournamentCity}`,
      isRated: tournamentIsRated,
      swissRounds: tournamentSwissRounds,
      topRounds: tournamentTopRounds,
      participants: selectedParticipants,
      status: 'draft',
      rounds: [],
      currentRound: 0
    };

    addTournament(tournament);

    // Сбросить форму
    if (tournamentNameInputRef.current) tournamentNameInputRef.current.value = '';
    if (tournamentDateInputRef.current) tournamentDateInputRef.current.value = '';
    if (tournamentCitySelectRef.current) tournamentCitySelectRef.current.value = '';
    if (tournamentFormatSelectRef.current) tournamentFormatSelectRef.current.value = '';
    if (tournamentIsRatedInputRef.current) tournamentIsRatedInputRef.current.checked = true;
    if (tournamentSwissRoundsInputRef.current) tournamentSwissRoundsInputRef.current.value = '3';
    if (tournamentTopRoundsInputRef.current) tournamentTopRoundsInputRef.current.value = '0';
    
    // Checkbox'ы участников очистятся автоматически через key при ререндере

    alert(`Турнир "${tournament.name}" создан!`);
    navigateTo('tournaments');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Plus" size={20} />
            Создание турнира
          </CardTitle>
          <CardDescription>
            Заполните данные для создания нового турнира
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Основные данные турнира */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Название турнира</Label>
              <Input
                key="tournament-name-input"
                ref={tournamentNameInputRef}
                id="tournament-name"
                type="text"
                placeholder="Введите название турнира"
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tournament-date">Дата турнира</Label>
              <Input
                key="tournament-date-input"
                ref={tournamentDateInputRef}
                id="tournament-date"
                type="date"
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tournament-city">Город</Label>
              <select
                key="tournament-city-select"
                ref={tournamentCitySelectRef}
                id="tournament-city"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue=""
              >
                <option value="">Выберите город</option>
                {appState.cities.map(city => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tournament-format">Формат</Label>
              <select
                key="tournament-format-select"
                ref={tournamentFormatSelectRef}
                id="tournament-format"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue=""
              >
                <option value="">Выберите формат</option>
                {appState.tournamentFormats.map(format => (
                  <option key={format.id} value={format.name}>
                    {format.name} (коэф. {format.coefficient})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Настройки турнира */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <input
                key="tournament-rated-checkbox"
                ref={tournamentIsRatedInputRef}
                type="checkbox"
                id="is-rated"
                defaultChecked={true}
                className="w-4 h-4"
              />
              <Label htmlFor="is-rated">Рейтинговый турнир</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="swiss-rounds">Туры швейцарки (1-8)</Label>
              <Input
                key="tournament-swiss-rounds-input"
                ref={tournamentSwissRoundsInputRef}
                id="swiss-rounds"
                type="number"
                min="1"
                max="8"
                defaultValue="3"
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="top-rounds">Туры топа</Label>
              <Input
                key="tournament-top-rounds-input"
                ref={tournamentTopRoundsInputRef}
                id="top-rounds"
                type="number"
                min="0"
                defaultValue="0"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Участники */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Участники турнира</Label>

            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {appState.players.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Нет игроков</p>
                  <p className="text-sm mt-2">Добавьте игроков в системе</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {appState.players.map(player => (
                    <div key={player.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-accent/50 transition-colors">
                      <input
                        type="checkbox"
                        id={`player-${player.id}`}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`player-${player.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.city} • Рейтинг: {player.rating}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4">
            <Button onClick={handleTournamentSubmit} className="flex-1">
              <Icon name="Plus" size={16} className="mr-2" />
              Создать турнир
            </Button>
            <Button variant="outline" onClick={() => navigateTo('tournaments')}>
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});