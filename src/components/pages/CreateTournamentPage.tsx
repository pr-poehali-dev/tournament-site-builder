import React, { useState, useEffect } from 'react';
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
  judgeId?: string;
  tSeating: boolean;
}

interface CreateTournamentPageProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
  addTournament: (tournament: Tournament) => Promise<{ success: boolean; error?: string; tournament: Tournament }>;
  tournamentForm: TournamentForm;
  setTournamentForm: React.Dispatch<React.SetStateAction<TournamentForm>>;
  startEditTournament: (tournament: Tournament) => void;
  syncDbUsersToPlayers: (dbUsers: any[]) => void;
}

export const CreateTournamentPage: React.FC<CreateTournamentPageProps> = React.memo(({
  appState,
  navigateTo,
  addTournament,
  tournamentForm,
  setTournamentForm,
  startEditTournament,
  syncDbUsersToPlayers
}) => {
  const [dbUsers, setDbUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');

  // Загружаем пользователей из БД при монтировании компонента
  useEffect(() => {
    const loadUsersFromDatabase = async () => {
      setLoadingUsers(true);
      setUsersError('');
      
      try {
        const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Преобразуем пользователей из БД в формат, совместимый с appState.users
        const usersFromDb = data.users.map(user => ({
          id: user.id.toString(),
          username: user.username,
          name: user.name,
          role: user.role,
          city: user.city,
          isActive: user.is_active,
          password: '***' // Пароли не передаём в frontend
        }));

        setDbUsers(usersFromDb);
        console.log('✅ Загружено пользователей из БД:', usersFromDb.length);
      } catch (error) {
        console.error('❌ Ошибка загрузки пользователей из БД:', error);
        setUsersError(`Ошибка загрузки: ${error.message}`);
        // Fallback к локальным пользователям
        setDbUsers(appState.users);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsersFromDatabase();
  }, []);

  // Синхронизируем пользователей с appState.players после загрузки
  useEffect(() => {
    if (dbUsers.length > 0) {
      syncDbUsersToPlayers(dbUsers);
    }
  }, [dbUsers, syncDbUsersToPlayers]);

  // Используем пользователей из БД, если они загружены, иначе fallback к локальным
  const availableUsers = dbUsers.length > 0 ? dbUsers : appState.users;
  const handleTournamentSubmit = async () => {
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

    try {
      // Сначала сохраняем локально
      const result = await addTournament(tournament);
      
      // Попробуем сохранить в БД через backend функцию
      try {
        const requestBody = {
          name: tournament.name,
          format: tournament.format,
          city: tournament.city,
          date: tournament.date,
          swissRounds: tournament.swissRounds,
          topRounds: tournament.topRounds,
          isRated: tournament.isRated,
          judgeId: tournamentForm.judgeId || tournament.judgeId,
          participants: tournament.participants,
          tSeating: tournamentForm.tSeating
        };
        
        console.log('📤 Отправка турнира в БД:', requestBody);
        
        const response = await fetch('https://functions.poehali.dev/27da478c-7993-4119-a4e5-66f336dbb8c0', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Турнир сохранён в БД:', data);
          
          // Обновляем турнир с dbId из БД
          if (data.tournament?.id) {
            tournament.dbId = data.tournament.id;
          }
          
          alert('Турнир успешно создан и сохранён в базе данных!');
        } else {
          const errorData = await response.json();
          console.error('❌ Ошибка сохранения в БД:', errorData);
          alert('Турнир создан локально. Ошибка сохранения в БД: ' + (errorData.error || 'неизвестная ошибка'));
        }
      } catch (dbError) {
        console.error('❌ Ошибка подключения к БД:', dbError);
        alert('Турнир создан локально. База данных временно недоступна.');
      }
      
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
        tSeating: false
      });
      
      // Переходим к странице управления созданным турниром
      startEditTournament(tournament);
    } catch (error) {
      alert(`Ошибка при создании турнира: ${error.message}`);
    }
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
            {dbUsers.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                БД подключена
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Заполните данные для создания нового турнира. 
            {dbUsers.length > 0 
              ? `Участники загружаются из базы данных (${dbUsers.length} доступно).`
              : `Используются локальные данные (${appState.users.length} доступно).`
            }
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
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="t-seating"
                checked={tournamentForm.tSeating}
                onChange={(e) => handleInputChange('tSeating', e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="t-seating">Генерация рассадки</Label>
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
              users={dbUsers.length > 0 ? dbUsers : appState.users}
              cities={appState.cities}
              selectedJudgeId={tournamentForm.judgeId || ""}
              onJudgeChange={handleJudgeChange}
              placeholder={dbUsers.length > 0 
                ? `Выберите судью из БД (${dbUsers.filter(u => u.role === 'judge' || u.role === 'admin').length} доступно)`
                : "Выберите судью турнира"
              }
              defaultCityFilter={tournamentForm.city}
            />
          </div>

          {/* Участники */}
          <div className="space-y-4">
            <Label>Участники турнира</Label>
            {loadingUsers ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                <span>Загрузка пользователей из базы данных...</span>
              </div>
            ) : usersError ? (
              <div className="p-4 border rounded-md bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                  <Icon name="AlertTriangle" size={16} />
                  <span className="font-medium">Предупреждение</span>
                </div>
                <p className="text-sm text-yellow-600 mb-2">{usersError}</p>
                <p className="text-sm text-yellow-600">Используются локальные данные как fallback.</p>
              </div>
            ) : null}
            
            <SimplePlayerSearch
              players={availableUsers}
              cities={appState.cities}
              selectedPlayerIds={tournamentForm.participants}
              onPlayersChange={handleParticipantsChange}
              placeholder={`Найти и добавить участников... (${availableUsers.length} доступно${dbUsers.length > 0 ? ' из БД' : ' локально'})`}
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