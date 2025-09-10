import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { SimplePlayerSearch } from '@/components/ui/simple-player-search';
import { SimpleJudgeSearch } from '@/components/ui/simple-judge-search';
import type { AppState, Tournament, Page } from '@/types';

interface TournamentForm {
  name: string;
  date: string;
  city: string;
  format: string;
  description: string;
  isRated: boolean;
  swissRounds: number;
  topRounds: number;
  participants: string[];
}

interface CreateTournamentPageProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
  addTournament: (tournament: Tournament) => void;
  tournamentForm: TournamentForm;
  setTournamentForm: React.Dispatch<React.SetStateAction<TournamentForm>>;
}

export const CreateTournamentPage: React.FC<CreateTournamentPageProps> = React.memo(({
  appState,
  navigateTo,
  addTournament,
  tournamentForm,
  setTournamentForm
}) => {
  const handleTournamentSubmit = () => {
    const { name, date, city, format, isRated, swissRounds, topRounds, participants } = tournamentForm;
    
    if (!name.trim()) {
      alert('Введите название турнира');
      return;
    }
    if (!date.trim()) {
      alert('Выберите дату турнира');
      return;
    }
    if (!city.trim()) {
      alert('Выберите город');
      return;
    }
    if (!format.trim()) {
      alert('Выберите формат');
      return;
    }

    if (participants.length === 0) {
      alert('Добавьте хотя бы одного участника');
      return;
    }

    // Создать объект турнира и передать в функцию создания
    const tournament: Tournament = {
      id: `tournament-${Date.now()}`,
      name: name.trim(),
      date: date.trim(),
      city: city.trim(),
      format: format.trim(),
      description: `Турнир по формату ${format.trim()} в городе ${city.trim()}`,
      isRated,
      swissRounds: Math.max(1, Math.min(8, swissRounds)),
      topRounds: Math.max(0, topRounds),
      participants,
      status: 'draft',
      currentRound: 0,
      rounds: [],
      judgeId: appState.currentUser?.id || ''
    };

    addTournament(tournament);
    
    // Очистить форму с сохранением города пользователя и текущей даты
    const today = new Date().toISOString().split('T')[0];
    const userCity = appState.currentUser?.city || '';
    
    setTournamentForm({
      name: '',
      date: today,
      city: userCity,
      format: 'sealed',
      description: '',
      isRated: true,
      swissRounds: 3,
      topRounds: 1,
      participants: [],
      judgeId: appState.currentUser?.id || ''
    });
    
    // Переходим к странице управления созданным турниром
    navigateTo({ page: 'tournament-view', tournamentId: tournament.id });
  };

  const handleInputChange = (field: keyof TournamentForm, value: string | boolean | number) => {
    setTournamentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParticipantsChange = (playerIds: string[]) => {
    setTournamentForm(prev => ({
      ...prev,
      participants: playerIds
    }));
  };

  const handleJudgeChange = (judgeId: string) => {
    setTournamentForm(prev => ({
      ...prev,
      judgeId: judgeId
    }));
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
                id="tournament-name"
                type="text"
                placeholder="Введите название турнира"
                value={tournamentForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tournament-date">Дата турнира</Label>
              <Input
                id="tournament-date"
                type="date"
                value={tournamentForm.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tournament-city">Город</Label>
              <select
                id="tournament-city"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={tournamentForm.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
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
                id="tournament-format"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={tournamentForm.format}
                onChange={(e) => handleInputChange('format', e.target.value)}
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
                type="checkbox"
                id="is-rated"
                checked={tournamentForm.isRated}
                onChange={(e) => handleInputChange('isRated', e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="is-rated">Рейтинговый турнир</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="swiss-rounds">Туры швейцарки (1-8)</Label>
              <Input
                id="swiss-rounds"
                type="number"
                min="1"
                max="8"
                value={tournamentForm.swissRounds}
                onChange={(e) => handleInputChange('swissRounds', parseInt(e.target.value) || 3)}
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="top-rounds">Туры топа</Label>
              <Input
                id="top-rounds"
                type="number"
                min="0"
                value={tournamentForm.topRounds}
                onChange={(e) => handleInputChange('topRounds', parseInt(e.target.value) || 0)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Судья турнира */}
          <div className="space-y-4">
            <Label>Судья турнира</Label>
            <SimpleJudgeSearch
              users={appState.users}
              cities={appState.cities}
              selectedJudgeId={tournamentForm.judgeId}
              onJudgeChange={handleJudgeChange}
              placeholder="Выберите судью турнира"
              defaultCityFilter={tournamentForm.city}
            />
          </div>

          {/* Участники */}
          <div className="space-y-4">
            <Label>Участники турнира</Label>
            <SimplePlayerSearch
              players={appState.users}
              cities={appState.cities}
              selectedPlayerIds={tournamentForm.participants}
              onPlayersChange={handleParticipantsChange}
              placeholder="Найти и добавить участников..."
              defaultCityFilter={tournamentForm.city}
            />
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