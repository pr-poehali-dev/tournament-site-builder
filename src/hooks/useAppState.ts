import { useState, useEffect, useCallback } from 'react';
import type { AppState, UIState, User, Player, City, TournamentFormat, Tournament, Page, Round, Match } from '@/types';
import { saveUIStateToLocalStorage, loadUIStateFromLocalStorage, clearOldLocalStorage } from '@/utils/storage';
import { getInitialState } from '@/utils/initialState';
import { api } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

// Вспомогательная функция для получения заголовков с токеном
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['X-Auth-Token'] = token;
  }
  return headers;
};

export const useAppState = () => {
  // Load only UI state from localStorage
  const [appState, setAppState] = useState<AppState>(() => {
    const savedUIState = loadUIStateFromLocalStorage();
    const initialState = getInitialState();
    
    // Clear old full state from localStorage
    clearOldLocalStorage();
    
    // Restore last page from localStorage
    const lastPageStr = localStorage.getItem('lastPage');
    let lastPage: Page | null = null;
    
    if (lastPageStr) {
      try {
        lastPage = JSON.parse(lastPageStr);
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
    
    if (savedUIState) {
      return {
        ...initialState,
        currentUser: savedUIState.currentUser,
        currentPage: lastPage || savedUIState.currentPage,
        showLogin: savedUIState.showLogin
      };
    }
    return {
      ...initialState,
      currentPage: lastPage || initialState.currentPage
    };
  });

  // Auto-save only UI state to localStorage
  useEffect(() => {
    const uiState: UIState = {
      currentUser: appState.currentUser,
      currentPage: appState.currentPage,
      showLogin: appState.showLogin
    };
    saveUIStateToLocalStorage(uiState);
  }, [appState.currentUser, appState.currentPage, appState.showLogin]);

  // Load tournaments from database on app start (GET is public)
  useEffect(() => {
    const loadTournamentsFromDatabase = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45', {
          method: 'GET',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          
          // Load games for all tournaments
          let allGames: any[] = [];
          try {
            const gamesResponse = await fetch(`${API_BASE_URL}/api/games`, {
              method: 'GET',
              headers: getAuthHeaders()
            });
            
            if (gamesResponse.ok) {
              const gamesData = await gamesResponse.json();
              allGames = gamesData.games || [];
            }
          } catch (error) {
            console.warn('⚠️ Не удалось загрузить игры из БД:', error);
          }
          
          const tournamentsFromDb = data.tournaments.map((t: any) => {
            // Map database status to frontend status
            let frontendStatus: 'draft' | 'active' | 'completed' | 'confirmed' = 'draft';
            if (t.status === 'active') frontendStatus = 'active';
            else if (t.status === 'completed') frontendStatus = 'completed';
            else if (t.status === 'confirmed') frontendStatus = 'confirmed';
            else frontendStatus = 'draft'; // 'setup' or any other value maps to 'draft'
            
            // Load games for this tournament and build rounds
            const tournamentGames = allGames.filter((g: any) => g.tournament_id === t.id);
            const roundsMap = new Map<number, any>();
            
            tournamentGames.forEach((game: any) => {
              if (!roundsMap.has(game.round_number)) {
                roundsMap.set(game.round_number, {
                  number: game.round_number,
                  matches: []
                });
              }
              
              const round = roundsMap.get(game.round_number);
              
              round.matches.push({
                id: game.id.toString(),
                player1Id: game.player1_id.toString(),
                player2Id: game.player2_id ? game.player2_id.toString() : undefined,
                points1: game.result === 'win1' ? 3 : (game.result === 'draw' ? 1 : 0),
                points2: game.result === 'win2' ? 3 : (game.result === 'draw' ? 1 : 0),
                result: game.result,
                tableNumber: game.table_number || undefined
              });
            });
            
            const rounds = Array.from(roundsMap.values()).sort((a, b) => a.number - b.number);
            
            return {
              id: t.id.toString(),
              dbId: t.id,
              name: t.name,
              format: t.format || 'sealed',
              date: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              city: t.city || '',
              description: `Турнир по формату ${t.format || 'sealed'}`,
              isRated: t.is_rated !== false,
              swissRounds: t.swiss_rounds || 3,
              topRounds: t.top_rounds || 0,
              participants: (t.participants || []).map((id: number) => id.toString()),
              status: frontendStatus,
              currentRound: t.current_round || 0,
              rounds: rounds,
              judgeId: t.judge_id ? t.judge_id.toString() : '',
              droppedPlayerIds: (t.droppedPlayers || []).map((id: number) => id.toString()),
              hasSeating: t.hasSeating || false
            };
          });
          
          console.log('🔄 Загружено турниров из БД:', tournamentsFromDb.length);
          
          setAppState(prev => ({
            ...prev,
            tournaments: tournamentsFromDb
          }));
        }
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить турниры из БД:', error);
      }
    };

    loadTournamentsFromDatabase();
  }, []);



  // Navigation functions
  const navigateTo = (page: Page) => {
    console.log('Navigation to:', page);
    localStorage.setItem('lastPage', JSON.stringify(page));
    setAppState(prev => ({ ...prev, currentPage: page }));
  };

  // Auth functions
  const showLoginForm = () => {
    setAppState(prev => ({ ...prev, showLogin: true }));
  };

  const hideLoginForm = () => {
    setAppState(prev => ({ ...prev, showLogin: false }));
  };

  const setCurrentUser = (user: User | null) => {
    setAppState(prev => ({ ...prev, currentUser: user }));
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('lastPage');
    localStorage.removeItem('lastTournamentId');
    setAppState(prev => ({ ...prev, currentUser: null, showLogin: false, currentPage: 'rating' }));
  };

  // User management functions
  const toggleUserStatus = async (userId: string) => {
    // Находим текущего пользователя
    const currentUser = appState.users.find(u => u.id === userId);
    if (!currentUser) return;

    const newStatus = !currentUser.isActive;
    console.log('🔄 Переключаем статус пользователя:', userId, 'на', newStatus);

    try {
      // Обновляем статус в БД
      const response = await fetch(`https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792?id=${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_active: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }

      const responseData = await response.json();
      console.log('✅ Статус пользователя обновлён в БД:', responseData);

      // Обновляем локальное состояние
      setAppState(prev => ({
        ...prev,
        users: prev.users.map(user =>
          user.id === userId ? { ...user, isActive: newStatus } : user
        )
      }));
    } catch (error: any) {
      console.error('❌ Ошибка обновления статуса пользователя:', error);
      alert(`Ошибка обновления статуса: ${error?.message || 'Неизвестная ошибка'}`);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'player' | 'judge' | 'admin') => {
    console.log('🔄 Обновляем роль пользователя:', userId, 'на', newRole);

    try {
      // Обновляем роль в БД
      const response = await fetch(`https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792?id=${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          role: newRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      const responseData = await response.json();
      console.log('✅ Роль пользователя обновлена в БД:', responseData);

      // Обновляем локальное состояние
      setAppState(prev => ({
        ...prev,
        users: prev.users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      }));
    } catch (error: any) {
      console.error('❌ Ошибка обновления роли пользователя:', error);
      alert(`Ошибка обновления роли: ${error?.message || 'Неизвестная ошибка'}`);
    }
  };

  const deleteUser = async (userId: string) => {
    console.log('🗑️ Начинаем удаление пользователя:', userId);
    try {
      const url = `https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792?id=${userId}`;
      console.log('🌐 DELETE запрос на:', url);
      
      // Удаляем пользователя из БД через backend API
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      console.log('📡 Получен ответ, статус:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Ошибка от сервера:', errorData);
        throw new Error(errorData.error || 'Failed to delete user');
      }

      const responseData = await response.json();
      console.log('✅ Успешный ответ от сервера:', responseData);

      // Обновляем локальное состояние только после успешного удаления из БД
      setAppState(prev => ({
        ...prev,
        users: prev.users.filter(user => user.id !== userId),
        // Также удаляем связанного игрока, если он существует
        players: prev.players.filter(player => player.id !== userId)
      }));

      console.log('✅ Пользователь успешно удалён из БД:', userId);
      
      // Reload users from database to sync
      const reloadResponse = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792');
      if (reloadResponse.ok) {
        const data = await response.json();
        if (data.users) {
          syncDbUsersToPlayers(data.users);
        }
      }
    } catch (error: any) {
      console.error('❌ Ошибка удаления пользователя из БД:', error);
      console.error('❌ Детали ошибки:', { message: error?.message, name: error?.name, stack: error?.stack });
      alert(`Ошибка удаления пользователя: ${error?.message || 'Неизвестная ошибка'}`);
    }
  };

  const addUser = async (user: User) => {
    try {
      // Сохраняем пользователя в БД через backend API
      const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
          city: user.city
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      const createdUser = data.user;

      // Обновляем локальное состояние с данными из БД
      const userForState: User = {
        id: createdUser.id.toString(),
        username: createdUser.username,
        name: createdUser.name,
        role: createdUser.role,
        city: createdUser.city,
        isActive: createdUser.is_active
      };

      setAppState(prev => ({
        ...prev,
        users: [...prev.users, userForState]
      }));

      return { success: true, user: userForState };
    } catch (error) {
      console.error('Error creating user:', error);
      
      // В случае ошибки сохраняем локально как fallback
      setAppState(prev => ({
        ...prev,
        users: [...prev.users, user]
      }));

      return { success: false, error: error.message };
    }
  };

  const updateUser = (updatedUser: User) => {
    setAppState(prev => ({
      ...prev,
      currentUser: prev.currentUser?.id === updatedUser.id ? updatedUser : prev.currentUser,
      users: prev.users.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      )
    }));
  };

  // Player management functions
  const addPlayer = useCallback((player: Player) => {
    setAppState(prev => ({
      ...prev,
      players: [...prev.players, player]
    }));
  }, []);

  const deletePlayer = (playerId: string) => {
    setAppState(prev => ({
      ...prev,
      players: prev.players.filter(player => player.id !== playerId)
    }));
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setAppState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId ? { ...player, ...updates } : player
      )
    }));
  };

  // Sync database users to both players and users
  const syncDbUsersToPlayers = useCallback((dbUsers: any[]) => {
    console.log('🔄 Синхронизируем пользователей из БД с appState:', dbUsers.length);
    
    // Преобразуем пользователей из БД в формат Player
    const playersFromDb = dbUsers.map(user => ({
      id: user.id.toString(),
      name: user.name,
      city: user.city || '',
      rating: user.rating ?? 1200,
      tournaments: user.tournaments ?? 0,
      wins: user.wins ?? 0,
      losses: user.losses ?? 0,
      draws: user.draws ?? 0
    }));

    // Преобразуем пользователей из БД в формат User
    const usersFromDb = dbUsers.map(user => ({
      id: user.id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
      city: user.city || '',
      isActive: user.is_active !== false
    }));

    setAppState(prev => {
      console.log('✅ Заменяем игроков данными из БД:', playersFromDb.length);
      console.log('✅ Заменяем пользователей данными из БД:', usersFromDb.length);
      
      // Если есть текущий пользователь, обновляем его данные из БД
      let updatedCurrentUser = prev.currentUser;
      if (prev.currentUser) {
        const userFromDb = usersFromDb.find(u => u.id === prev.currentUser?.id);
        if (userFromDb) {
          updatedCurrentUser = userFromDb;
          console.log('✅ Обновили currentUser из БД:', userFromDb);
        }
      }
      
      return {
        ...prev,
        players: playersFromDb,
        users: usersFromDb,
        currentUser: updatedCurrentUser
      };
    });
  }, []);

  // Global DB sync on app start (GET is public)
  useEffect(() => {
    const loadUsersFromDatabase = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792', {
          method: 'GET',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🔄 Глобальная синхронизация пользователей из БД:', data.users.length);
          syncDbUsersToPlayers(data.users);
        }
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить пользователей из БД при инициализации:', error);
      }
    };

    loadUsersFromDatabase();
  }, [syncDbUsersToPlayers]);

  // Sync tournaments from database
  const syncDbTournaments = useCallback((tournamentsFromDb: any[]) => {
    const mappedTournaments = tournamentsFromDb.map((t: any) => {
      // Map database status to frontend status
      let frontendStatus: 'draft' | 'active' | 'completed' | 'confirmed' = 'draft';
      if (t.status === 'active') frontendStatus = 'active';
      else if (t.status === 'completed') frontendStatus = 'completed';
      else if (t.status === 'confirmed') frontendStatus = 'confirmed';
      else frontendStatus = 'draft';
      
      return {
        id: t.id.toString(),
        dbId: t.id,
        name: t.name,
        format: t.format || 'sealed',
        date: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        city: t.city || '',
        description: `Турнир по формату ${t.format || 'sealed'}`,
        isRated: t.is_rated !== false,
        swissRounds: t.swiss_rounds || 3,
        topRounds: t.top_rounds || 0,
        participants: (t.participants || []).map((id: number) => id.toString()),
        status: frontendStatus,
        currentRound: t.current_round || 0,
        rounds: [],
        judgeId: t.judge_id ? t.judge_id.toString() : '',
        droppedPlayerIds: (t.droppedPlayers || []).map((id: number) => id.toString()),
        hasSeating: t.hasSeating || false
      };
    });
    
    setAppState(prev => ({
      ...prev,
      tournaments: mappedTournaments
    }));
  }, []);

  // Load cities from database on app start
  useEffect(() => {
    const loadCitiesFromDatabase = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/f303dad0-70ce-4afc-b099-fdd164944f64', {
          method: 'GET'
        });

        if (response.ok) {
          const data = await response.json();
          const citiesFromDb = data.cities.map((c: any) => ({
            id: c.id.toString(),
            name: c.name
          }));
          
          console.log('🔄 Загружено городов из БД:', citiesFromDb.length);
          
          setAppState(prev => ({
            ...prev,
            cities: citiesFromDb
          }));
        }
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить города из БД:', error);
      }
    };

    loadCitiesFromDatabase();
  }, []);

  // City management functions
  const addCity = useCallback(async (city: City) => {
    try {
      const response = await fetch('https://functions.poehali.dev/f303dad0-70ce-4afc-b099-fdd164944f64', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: city.name })
      });

      if (response.ok) {
        const data = await response.json();
        const newCity: City = {
          id: data.id.toString(),
          name: data.name
        };
        
        setAppState(prev => ({
          ...prev,
          cities: [...prev.cities, newCity]
        }));
        
        toast({
          title: "Город добавлен",
          description: `Город "${newCity.name}" успешно добавлен`
        });
      }
    } catch (error) {
      console.error('Error adding city:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить город",
        variant: "destructive"
      });
    }
  }, []);

  const deleteCity = async (cityId: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/f303dad0-70ce-4afc-b099-fdd164944f64?id=${cityId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setAppState(prev => ({
          ...prev,
          cities: prev.cities.filter(c => c.id !== cityId)
        }));
        
        toast({
          title: "Город удалён",
          description: "Город успешно удалён"
        });
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить город",
        variant: "destructive"
      });
    }
  };

  const updateCity = async (cityId: string, updates: Partial<City>) => {
    const oldCity = appState.cities.find(c => c.id === cityId);
    const oldName = oldCity?.name;
    const newName = updates.name;

    try {
      const response = await fetch('https://functions.poehali.dev/f303dad0-70ce-4afc-b099-fdd164944f64', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: cityId, name: newName })
      });

      if (response.ok) {
        setAppState(prev => ({
          ...prev,
          cities: prev.cities.map(city =>
            city.id === cityId ? { ...city, ...updates } : city
          ),
          // Обновляем название города у всех игроков и пользователей
          ...(oldName && newName && oldName !== newName ? {
            players: prev.players.map(player =>
              player.city === oldName ? { ...player, city: newName } : player
            ),
            users: prev.users.map(user =>
              user.city === oldName ? { ...user, city: newName } : user
            )
          } : {})
        }));
        
        toast({
          title: "Город обновлён",
          description: `Город переименован в "${newName}"`
        });
      }
    } catch (error) {
      console.error('Error updating city:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить город",
        variant: "destructive"
      });
    }
  };

  // Load tournament formats from database on app start
  useEffect(() => {
    const loadFormatsFromDatabase = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/bc0a368c-af39-49c9-bc4c-18b509328810', {
          method: 'GET'
        });

        if (response.ok) {
          const data = await response.json();
          const formatsFromDb = data.formats.map((f: any) => ({
            id: f.id.toString(),
            name: f.name,
            coefficient: f.coefficient
          }));
          
          console.log('🔄 Загружено форматов из БД:', formatsFromDb.length);
          
          setAppState(prev => ({
            ...prev,
            tournamentFormats: formatsFromDb
          }));
        }
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить форматы из БД:', error);
      }
    };

    loadFormatsFromDatabase();
  }, []);

  // Tournament format management functions
  const addTournamentFormat = async (format: TournamentFormat) => {
    try {
      const response = await fetch('https://functions.poehali.dev/bc0a368c-af39-49c9-bc4c-18b509328810', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: format.name, coefficient: format.coefficient })
      });

      if (response.ok) {
        const data = await response.json();
        const newFormat: TournamentFormat = {
          id: data.id.toString(),
          name: data.name,
          coefficient: data.coefficient
        };
        
        setAppState(prev => ({
          ...prev,
          tournamentFormats: [...prev.tournamentFormats, newFormat]
        }));
        
        toast({
          title: "Формат добавлен",
          description: `Формат "${newFormat.name}" успешно добавлен`
        });
      }
    } catch (error) {
      console.error('Error adding format:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить формат",
        variant: "destructive"
      });
    }
  };

  const deleteTournamentFormat = async (formatId: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/bc0a368c-af39-49c9-bc4c-18b509328810?id=${formatId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setAppState(prev => ({
          ...prev,
          tournamentFormats: prev.tournamentFormats.filter(f => f.id !== formatId)
        }));
        
        toast({
          title: "Формат удалён",
          description: "Формат успешно удалён"
        });
      }
    } catch (error) {
      console.error('Error deleting format:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить формат",
        variant: "destructive"
      });
    }
  };

  const updateTournamentFormat = async (formatId: string, updates: Partial<TournamentFormat>) => {
    try {
      const response = await fetch('https://functions.poehali.dev/bc0a368c-af39-49c9-bc4c-18b509328810', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: formatId, name: updates.name, coefficient: updates.coefficient })
      });

      if (response.ok) {
        setAppState(prev => ({
          ...prev,
          tournamentFormats: prev.tournamentFormats.map(format =>
            format.id === formatId ? { ...format, ...updates } : format
          )
        }));
        
        toast({
          title: "Формат обновлён",
          description: `Формат "${updates.name}" успешно обновлён`
        });
      }
    } catch (error) {
      console.error('Error updating format:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить формат",
        variant: "destructive"
      });
    }
  };

  // Tournament management functions
  const addTournament = async (tournament: Tournament) => {
    try {
      // First save to backend database
      const backendResponse = await api.tournaments.create(tournament);
      console.log('Tournament saved to backend:', backendResponse);
      
      // Then save to local state
      setAppState(prev => ({
        ...prev,
        tournaments: [...prev.tournaments, tournament]
      }));
      
      return { success: true, tournament };
    } catch (error) {
      console.error('Failed to save tournament to backend:', error);
      
      // Still save locally if backend fails
      setAppState(prev => ({
        ...prev,
        tournaments: [...prev.tournaments, tournament]
      }));
      
      return { success: false, error: error.message, tournament };
    }
  };

  const deleteTournament = (tournamentId: string) => {
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.filter(t => t.id !== tournamentId)
    }));
  };

  const updateTournament = (tournamentId: string, updates: Partial<Tournament>) => {
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(tournament =>
        tournament.id === tournamentId ? { ...tournament, ...updates } : tournament
      )
    }));
  };

  const updateTournaments = (updateFn: (tournaments: Tournament[]) => Tournament[]) => {
    setAppState(prev => ({
      ...prev,
      tournaments: updateFn(prev.tournaments)
    }));
  };

  // Load full tournament data with games from database
  const loadTournamentWithGames = useCallback(async (tournamentId: string) => {
    localStorage.setItem('lastTournamentId', tournamentId);
    
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament || !tournament.dbId) {
      console.warn('⚠️ Турнир не найден или не имеет dbId');
      return;
    }

    try {
      const response = await fetch(
        `https://functions.poehali.dev/f701e507-6542-4d30-be94-8bcad260ece0?tournament_id=${tournament.dbId}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        console.error('❌ Ошибка загрузки игр из БД:', await response.text());
        return;
      }

      const data = await response.json();
      const games = data.games || [];

      console.log('📥 Загружено игр из БД:', games.length);

      // Group games by round_number
      const gamesByRound = games.reduce((acc: any, game: any) => {
        const roundNum = game.round_number;
        if (!acc[roundNum]) {
          acc[roundNum] = [];
        }
        acc[roundNum].push(game);
        return acc;
      }, {});

      // Create rounds from games
      const rounds: Round[] = Object.keys(gamesByRound)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((roundNum) => {
          const roundGames = gamesByRound[roundNum];
          const matches = roundGames.map((game: any, index: number) => ({
            id: `match-${game.id}`,
            player1Id: game.player1_id.toString(),
            player2Id: game.player2_id ? game.player2_id.toString() : undefined,
            points1: game.result === 'win1' ? 3 : game.result === 'draw' ? 1 : 0,
            points2: game.result === 'win2' ? 3 : game.result === 'draw' ? 1 : 0,
            result: game.result || undefined,
            tableNumber: game.player2_id ? index + 1 : undefined
          }));

          const isCompleted = matches.every((m: any) => !m.player2Id || m.result);

          return {
            id: `round-${roundNum}`,
            number: parseInt(roundNum),
            matches,
            isCompleted
          };
        });

      // Calculate currentRound based on real rounds (excluding seating round with number 0)
      const realRounds = rounds.filter(r => r.number > 0);
      const currentRound = realRounds.length > 0 
        ? Math.max(...realRounds.map(r => r.number)) 
        : 0;

      // Update tournament with loaded data
      setAppState(prev => ({
        ...prev,
        tournaments: prev.tournaments.map(t =>
          t.id === tournamentId
            ? { ...t, rounds, currentRound }
            : t
        )
      }));

      console.log('✅ Турнир загружен с данными:', { tournamentId, rounds: rounds.length, currentRound });
    } catch (error) {
      console.error('❌ Ошибка загрузки турнира из БД:', error);
    }
  }, [appState.tournaments]);

  // Specific tournament operations
  const addTournamentRound = useCallback(async (tournamentId: string, newRound: Round) => {
    // Find tournament to get dbId
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    
    // Save pairings to database
    if (tournament?.dbId) {
      try {
        const pairings = newRound.matches.map(match => ({
          player1_id: parseInt(match.player1Id),
          player2_id: match.player2Id ? parseInt(match.player2Id) : null,
          table_number: match.tableNumber !== undefined ? match.tableNumber : null
        }));
        
        console.log('📤 Сохранение пар в БД:', {
          tournament_id: tournament.dbId,
          round_number: newRound.number,
          pairings
        });
        
        const response = await fetch('https://functions.poehali.dev/f701e507-6542-4d30-be94-8bcad260ece0', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            tournament_id: tournament.dbId,
            round_number: newRound.number,
            pairings
          })
        });
        
        if (response.ok) {
          console.log('✅ Пары сохранены в БД');
          
          // Update tournament current_round and status in database
          const updateResponse = await fetch('https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: tournament.dbId,
              current_round: newRound.number,
              status: 'active'
            })
          });
          
          if (updateResponse.ok) {
            console.log('✅ current_round обновлён в БД:', newRound.number);
          } else {
            console.error('❌ Ошибка обновления current_round в БД');
          }
        } else {
          console.error('❌ Ошибка сохранения пар в БД:', await response.text());
        }
      } catch (error) {
        console.error('❌ Ошибка подключения к БД при сохранении пар:', error);
      }
    } else {
      console.warn('⚠️ Турнир не имеет dbId, пары не сохранены в БД');
    }
    
    // Update local state
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t =>
        t.id === tournamentId
          ? {
              ...t,
              rounds: [...t.rounds, newRound],
              currentRound: t.currentRound + 1,
              status: 'active' as const
            }
          : t
      )
    }));
  }, [appState.tournaments]);

  const updateMatchResult = useCallback(async (tournamentId: string, roundId: string, matchId: string, result: 'win1' | 'win2' | 'draw') => {
    let points1 = 0, points2 = 0;
    
    switch (result) {
      case 'win1':
        points1 = 3;
        points2 = 0;
        break;
      case 'win2':
        points1 = 0;
        points2 = 3;
        break;
      case 'draw':
        points1 = 1;
        points2 = 1;
        break;
    }
    
    // Find match details to save result to database
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    const round = tournament?.rounds?.find(r => r.id === roundId);
    const match = round?.matches?.find(m => m.id === matchId);
    
    if (tournament?.dbId && round && match) {
      try {
        // Get games from database to find game_id
        const gamesResponse = await fetch(`https://functions.poehali.dev/f701e507-6542-4d30-be94-8bcad260ece0?tournament_id=${tournament.dbId}`);
        
        if (gamesResponse.ok) {
          const gamesData = await gamesResponse.json();
          const game = gamesData.games.find((g: any) => 
            g.round_number === round.number &&
            g.player1_id === parseInt(match.player1Id) &&
            (!match.player2Id || g.player2_id === parseInt(match.player2Id))
          );
          
          if (game) {
            // Update game result in database
            const updateResponse = await fetch('https://functions.poehali.dev/f701e507-6542-4d30-be94-8bcad260ece0', {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                game_id: game.id,
                result
              })
            });
            
            if (updateResponse.ok) {
              console.log('✅ Результат матча сохранён в БД');
            } else {
              console.error('❌ Ошибка сохранения результата в БД:', await updateResponse.text());
            }
          }
        }
      } catch (error) {
        console.error('❌ Ошибка подключения к БД при обновлении результата:', error);
      }
    }

    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(tournament =>
        tournament.id === tournamentId
          ? {
              ...tournament,
              rounds: tournament.rounds.map(round =>
                round.id === roundId
                  ? (() => {
                      const updatedMatches = round.matches.map(match =>
                        match.id === matchId
                          ? { ...match, result, points1, points2 }
                          : match
                      );
                      
                      // Check if all matches in this round are completed
                      const isRoundCompleted = updatedMatches.every(match => 
                        !match.player2Id || match.result
                      );
                      
                      return {
                        ...round,
                        matches: updatedMatches,
                        isCompleted: isRoundCompleted
                      };
                    })()
                  : round
              )
            }
          : tournament
      )
    }));
  }, [appState.tournaments]);

  const togglePlayerDrop = useCallback(async (tournamentId: string, playerId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const droppedPlayers = new Set(tournament.droppedPlayerIds || []);
    
    if (droppedPlayers.has(playerId)) {
      droppedPlayers.delete(playerId);
    } else {
      droppedPlayers.add(playerId);
    }
    
    const updatedDroppedPlayers = Array.from(droppedPlayers);

    // Update in database if tournament has dbId
    if (tournament.dbId) {
      try {
        const response = await fetch('https://functions.poehali.dev/27da478c-7993-4119-a4e5-66f336dbb8c0', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: tournament.dbId,
            droppedPlayers: updatedDroppedPlayers
          })
        });
        
        if (response.ok) {
          console.log('✅ Дропы синхронизированы с БД');
        } else {
          console.error('❌ Ошибка синхронизации дропов с БД:', await response.text());
        }
      } catch (error) {
        console.error('❌ Ошибка подключения к БД при обновлении дропов:', error);
      }
    }

    // Update local state
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t =>
        t.id === tournamentId
          ? { ...t, droppedPlayerIds: updatedDroppedPlayers }
          : t
      )
    }));
  }, [appState.tournaments]);

  const deleteLastRound = useCallback(async (tournamentId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    
    if (!tournament || tournament.rounds.length === 0) return;
    
    const lastRound = tournament.rounds[tournament.rounds.length - 1];
    
    // Delete games from database if tournament has dbId
    if (tournament.dbId && lastRound) {
      try {
        const response = await fetch(
          `https://functions.poehali.dev/f701e507-6542-4d30-be94-8bcad260ece0?tournament_id=${tournament.dbId}&round_number=${lastRound.number}`,
          {
            method: 'DELETE',
            headers: getAuthHeaders()
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Удалено ${data.deleted_count} игр из БД`);
        } else {
          console.error('❌ Ошибка удаления игр из БД:', await response.text());
        }
      } catch (error) {
        console.error('❌ Ошибка подключения к БД при удалении игр:', error);
      }
    }
    
    // Update local state
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t =>
        t.id === tournamentId && t.rounds.length > 0
          ? {
              ...t,
              rounds: t.rounds.slice(0, -1), // Удаляем последний тур
              currentRound: t.currentRound - 1 // Уменьшаем счетчик туров
            }
          : t
      )
    }));
  }, [appState.tournaments]);

  const updateRoundMatches = useCallback((tournamentId: string, roundId: string, updatedMatches: Match[]) => {
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(tournament =>
        tournament.id === tournamentId
          ? {
              ...tournament,
              rounds: tournament.rounds.map(round =>
                round.id === roundId
                  ? { ...round, matches: updatedMatches }
                  : round
              )
            }
          : tournament
      )
    }));
  }, []);

  const finishTournament = useCallback(async (tournamentId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    
    // Update in database if tournament has dbId
    if (tournament?.dbId) {
      try {
        const response = await fetch('https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: tournament.dbId,
            status: 'completed'
          })
        });
        
        if (response.ok) {
          console.log('✅ Статус турнира обновлён в БД: completed');
        } else {
          console.error('❌ Ошибка обновления статуса турнира в БД');
        }
      } catch (error) {
        console.error('❌ Ошибка подключения к БД при обновлении статуса:', error);
      }
    }
    
    // Update local state
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t =>
        t.id === tournamentId
          ? { ...t, status: 'completed' as const }
          : t
      )
    }));
  }, [appState.tournaments]);

  // Batch player updates for tournament confirmations
  const updatePlayersStats = (playersUpdates: Map<string, Partial<Player>>) => {
    setAppState(prev => ({
      ...prev,
      players: prev.players.map(player => {
        const updates = playersUpdates.get(player.id);
        return updates ? { ...player, ...updates } : player;
      })
    }));
  };

  // Combined tournament and player update for confirmations
  const confirmTournamentWithPlayerUpdates = useCallback((tournamentId: string, tournamentUpdates: Partial<Tournament>, playersUpdates?: Map<string, Partial<Player>>) => {
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t =>
        t.id === tournamentId
          ? { ...t, ...tournamentUpdates }
          : t
      ),
      players: playersUpdates 
        ? prev.players.map(player => {
            const updates = playersUpdates.get(player.id);
            return updates ? { ...player, ...updates } : player;
          })
        : prev.players
    }));
  }, []);

  // Calculate Elo rating changes and confirm tournament
  const confirmTournament = useCallback(async (tournamentId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament || tournament.status !== 'completed') return;

    // Get players with their initial ratings
    const playerRatings = new Map<string, number>();
    const playerStats = new Map<string, { wins: number; losses: number; draws: number }>();
    
    tournament.participants.forEach(participantId => {
      const player = appState.players.find(p => p.id === participantId);
      if (player) {
        playerRatings.set(participantId, player.rating);
        playerStats.set(participantId, { wins: 0, losses: 0, draws: 0 });
      }
    });

    // Elo rating calculation function
    const calculateEloChange = (playerRating: number, opponentRating: number, result: number, kFactor: number = 32) => {
      const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
      return Math.round(kFactor * (result - expectedScore));
    };

    // Process each round sequentially to update ratings
    tournament.rounds?.forEach(round => {
      round.matches?.forEach(match => {
        if (match.result) {
          const player1Id = match.player1Id;
          const player2Id = match.player2Id;
          
          if (!player2Id) {
            // Bye - no rating change, just count as win
            const stats = playerStats.get(player1Id);
            if (stats) {
              stats.wins += 1;
            }
          } else {
            const player1Rating = playerRatings.get(player1Id) || 1200;
            const player2Rating = playerRatings.get(player2Id) || 1200;
            
            let result1: number, result2: number;
            
            // Determine match results (0 = loss, 0.5 = draw, 1 = win)
            if (match.result === 'win1') {
              result1 = 1;
              result2 = 0;
              const stats1 = playerStats.get(player1Id);
              const stats2 = playerStats.get(player2Id);
              if (stats1) stats1.wins += 1;
              if (stats2) stats2.losses += 1;
            } else if (match.result === 'win2') {
              result1 = 0;
              result2 = 1;
              const stats1 = playerStats.get(player1Id);
              const stats2 = playerStats.get(player2Id);
              if (stats1) stats1.losses += 1;
              if (stats2) stats2.wins += 1;
            } else { // draw
              result1 = 0.5;
              result2 = 0.5;
              const stats1 = playerStats.get(player1Id);
              const stats2 = playerStats.get(player2Id);
              if (stats1) stats1.draws += 1;
              if (stats2) stats2.draws += 1;
            }
            
            // Calculate Elo changes
            const change1 = calculateEloChange(player1Rating, player2Rating, result1);
            const change2 = calculateEloChange(player2Rating, player1Rating, result2);
            
            // Update ratings for next matches
            playerRatings.set(player1Id, Math.max(0, player1Rating + change1));
            playerRatings.set(player2Id, Math.max(0, player2Rating + change2));
          }
        }
      });
    });

    // Prepare final updates for all players
    const ratingChanges = new Map<string, Partial<Player>>();
    
    tournament.participants.forEach(participantId => {
      const player = appState.players.find(p => p.id === participantId);
      const finalRating = playerRatings.get(participantId);
      const stats = playerStats.get(participantId);
      
      if (player && finalRating !== undefined && stats) {
        ratingChanges.set(participantId, {
          rating: finalRating,
          tournaments: player.tournaments + 1,
          wins: player.wins + stats.wins,
          losses: player.losses + stats.losses,
          draws: player.draws + stats.draws
        });
      }
    });

    // Save rating updates to database
    const updates = Array.from(ratingChanges.entries()).map(([userId, changes]) => ({
      user_id: userId,
      rating: changes.rating,
      tournaments: changes.tournaments,
      wins: changes.wins,
      losses: changes.losses,
      draws: changes.draws
    }));

    // Update tournament status to confirmed in database
    if (tournament.dbId) {
      try {
        const confirmResponse = await fetch('https://functions.poehali.dev/27da478c-7993-4119-a4e5-66f336dbb8c0', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: tournament.dbId,
            status: 'confirmed'
          })
        });
        
        if (confirmResponse.ok) {
          console.log('✅ Турнир подтверждён в БД (status = confirmed)');
          
          // Recalculate rating changes for all games in the tournament
          const recalcResponse = await fetch('https://functions.poehali.dev/b995ecfd-0dac-4af5-9359-0d111138afbd', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ tournament_id: tournament.dbId })
          });
          
          if (recalcResponse.ok) {
            const recalcData = await recalcResponse.json();
            console.log('✅ Рейтинги пересчитаны для игр турнира:', recalcData);
          } else {
            console.error('❌ Ошибка пересчёта рейтингов для игр');
          }
          
          // Save tournament results (places) to database
          const standings = tournament.participants.map(participantId => {
            let points = 0;
            let wins = 0;
            let losses = 0;
            let draws = 0;
            const opponentIds: string[] = [];

            tournament.rounds?.forEach(round => {
              if (round.number <= tournament.swissRounds) {
                const match = round.matches?.find(
                  m => m.player1Id === participantId || m.player2Id === participantId
                );
                if (match) {
                  if (!match.player2Id) {
                    points += 3;
                    wins += 1;
                  } else if (match.result) {
                    const isPlayer1 = match.player1Id === participantId;
                    const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
                    opponentIds.push(opponentId);

                    if (match.result === 'draw') {
                      points += 1;
                      draws += 1;
                    } else if (
                      (match.result === 'win1' && isPlayer1) ||
                      (match.result === 'win2' && !isPlayer1)
                    ) {
                      points += 3;
                      wins += 1;
                    } else {
                      losses += 1;
                    }
                  }
                }
              }
            });

            const buchholz = opponentIds.reduce((acc, opponentId) => {
              let opponentPoints = 0;
              tournament.rounds?.forEach(round => {
                if (round.number <= tournament.swissRounds) {
                  const opponentMatch = round.matches?.find(
                    m => m.player1Id === opponentId || m.player2Id === opponentId
                  );
                  if (opponentMatch) {
                    if (!opponentMatch.player2Id) {
                      opponentPoints += 3;
                    } else if (opponentMatch.result) {
                      const isOpponentPlayer1 = opponentMatch.player1Id === opponentId;
                      if (opponentMatch.result === 'draw') {
                        opponentPoints += 1;
                      } else if (
                        (opponentMatch.result === 'win1' && isOpponentPlayer1) ||
                        (opponentMatch.result === 'win2' && !isOpponentPlayer1)
                      ) {
                        opponentPoints += 3;
                      }
                    }
                  }
                }
              });
              return acc + opponentPoints;
            }, 0);

            return {
              user: appState.users.find(u => u.id === participantId),
              points,
              wins,
              losses,
              draws,
              buchholz,
              sumBuchholz: 0
            };
          }).filter(s => s.user).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
            return 0;
          });

          // Save results to database
          const resultsToSave = standings.map((standing, index) => ({
            tournament_id: tournament.dbId,
            player_id: standing.user!.id,
            place: index + 1,
            points: standing.points,
            buchholz: standing.buchholz,
            sum_buchholz: standing.sumBuchholz,
            wins: standing.wins,
            losses: standing.losses,
            draws: standing.draws
          }));

          console.log('💾 Сохраняю результаты турнира:', resultsToSave);

          try {
            const resultsResponse = await fetch('https://functions.poehali.dev/14e205c3-5a13-45c5-a7ab-d2b8ed973b65', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({ results: resultsToSave })
            });
            
            if (resultsResponse.ok) {
              const savedData = await resultsResponse.json();
              console.log('✅ Результаты турнира сохранены в БД:', savedData);
            } else {
              const errorText = await resultsResponse.text();
              console.error('❌ Ошибка сохранения результатов турнира:', errorText);
            }
          } catch (error) {
            console.warn('⚠️ Не удалось сохранить результаты турнира:', error);
          }
          
          // Reload tournaments from DB to sync status
          const tournamentsResponse = await fetch('https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45');
          const tournamentsData = await tournamentsResponse.json();
          
          if (tournamentsData?.tournaments) {
            syncDbTournaments(tournamentsData.tournaments);
            console.log('✅ Турниры синхронизированы с БД после подтверждения');
          }
        } else {
          console.error('❌ Ошибка подтверждения турнира в БД');
        }
      } catch (error) {
        console.error('❌ Ошибка подключения к БД при подтверждении турнира:', error);
      }
    }

    // Send batch update to backend
    toast({
      title: "Сохранение рейтингов...",
      description: "Обновляем данные игроков в базе данных",
    });

    try {
      const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792?batch=true', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ updates })
      });
      
      const data = await response.json();
      console.log('✅ Рейтинги обновлены в БД:', data);
      
      toast({
        title: "✅ Рейтинги сохранены",
        description: `Обновлено игроков: ${data.updated_count || updates.length}`,
      });
      
      // Reload users from DB to sync the latest ratings
      const usersResponse = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792');
      const usersData = await usersResponse.json();
      
      if (usersData?.users) {
        console.log('✅ Обновлены данные игроков из БД после подтверждения турнира');
        syncDbUsersToPlayers(usersData.users);
      }
    } catch (error) {
      console.error('❌ Ошибка обновления рейтингов в БД:', error);
      
      toast({
        title: "❌ Ошибка сохранения",
        description: "Не удалось сохранить рейтинги в базу данных",
        variant: "destructive",
      });
    }

    // Update tournament and players in local state
    confirmTournamentWithPlayerUpdates(tournamentId, { status: 'confirmed' as const }, ratingChanges);
  }, [appState.tournaments, appState.players, confirmTournamentWithPlayerUpdates, syncDbUsersToPlayers]);

  // Generate TOP elimination bracket pairings (Olympic system)
  const generateTopPairings = useCallback((tournament: Tournament, participants: Player[], nextRoundNumber: number) => {
    // Calculate final Swiss standings with tiebreakers
    const playerStandings = participants.map(player => {
      let points = 0;
      const opponentIds: string[] = [];

      // Go through all Swiss rounds to calculate points and track opponents
      tournament.rounds?.forEach(round => {
        if (round.number <= tournament.swissRounds) {
          const match = round.matches?.find(m => 
            m.player1Id === player.id || m.player2Id === player.id
          );
          
          if (match) {
            if (!match.player2Id) {
              // Bye
              points += 3;
            } else if (match.result) {
              const isPlayer1 = match.player1Id === player.id;
              const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
              opponentIds.push(opponentId);
              
              if (match.result === 'draw') {
                points += 1;
              } else if (
                (match.result === 'win1' && isPlayer1) ||
                (match.result === 'win2' && !isPlayer1)
              ) {
                points += 3;
              }
            }
          }
        }
      });

      // Calculate Buchholz (sum of opponents' points)
      const buchholz = opponentIds.reduce((acc, opponentId) => {
        let opponentPoints = 0;
        tournament.rounds?.forEach(round => {
          if (round.number <= tournament.swissRounds) {
            const opponentMatch = round.matches?.find(m =>
              m.player1Id === opponentId || m.player2Id === opponentId
            );
            if (opponentMatch) {
              if (!opponentMatch.player2Id) {
                opponentPoints += 3;
              } else if (opponentMatch.result) {
                const isOpponentPlayer1 = opponentMatch.player1Id === opponentId;
                if (opponentMatch.result === 'draw') {
                  opponentPoints += 1;
                } else if (
                  (opponentMatch.result === 'win1' && isOpponentPlayer1) ||
                  (opponentMatch.result === 'win2' && !isOpponentPlayer1)
                ) {
                  opponentPoints += 3;
                }
              }
            }
          }
        });
        return acc + opponentPoints;
      }, 0);

      // Calculate Buchholz-2 (sum of opponents' Buchholz)
      const sumBuchholz = opponentIds.reduce((acc, opponentId) => {
        let opponentBuchholz = 0;
        const opponentOpponentIds: string[] = [];
        
        tournament.rounds?.forEach(round => {
          if (round.number <= tournament.swissRounds) {
            const opponentMatch = round.matches?.find(m =>
              m.player1Id === opponentId || m.player2Id === opponentId
            );
            if (opponentMatch && opponentMatch.result) {
              if (!opponentMatch.player2Id) {
                // Skip bye matches
              } else {
                const isOpponentPlayer1 = opponentMatch.player1Id === opponentId;
                const opponentOpponentId = isOpponentPlayer1
                  ? opponentMatch.player2Id
                  : opponentMatch.player1Id;
                opponentOpponentIds.push(opponentOpponentId);
              }
            }
          }
        });

        opponentBuchholz = opponentOpponentIds.reduce((oppAcc, oppOppId) => {
          let oppOppPoints = 0;
          tournament.rounds?.forEach(round => {
            if (round.number <= tournament.swissRounds) {
              const oppOppMatch = round.matches?.find(m =>
                m.player1Id === oppOppId || m.player2Id === oppOppId
              );
              if (oppOppMatch) {
                if (!oppOppMatch.player2Id) {
                  oppOppPoints += 3;
                } else if (oppOppMatch.result) {
                  const isOppOppPlayer1 = oppOppMatch.player1Id === oppOppId;
                  if (oppOppMatch.result === 'draw') {
                    oppOppPoints += 1;
                  } else if (
                    (oppOppMatch.result === 'win1' && isOppOppPlayer1) ||
                    (oppOppMatch.result === 'win2' && !isOppOppPlayer1)
                  ) {
                    oppOppPoints += 3;
                  }
                }
              }
            }
          });
          return oppAcc + oppOppPoints;
        }, 0);

        return acc + opponentBuchholz;
      }, 0);

      return { player, points, buchholz, sumBuchholz };
    });

    // Sort by points, then Buchholz, then Buchholz-2 (all descending)
    playerStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
      return b.sumBuchholz - a.sumBuchholz;
    });

    // Determine bracket size based on topRounds (Olympic system)
    const topRounds = tournament.topRounds;
    const bracketSize = Math.pow(2, topRounds); // 2^N players in first TOP round
    
    // Current TOP round number (1-based) - based on the round we're creating
    const topRoundNumber = nextRoundNumber - tournament.swissRounds;
    
    // If this is the first TOP round, create bracket from Swiss standings
    if (topRoundNumber === 1) {
      // Number of tables in first TOP round: 2^(N-1) where N is topRounds
      // For TOP-8 (N=3): 2^2 = 4 tables
      // For TOP-4 (N=2): 2^1 = 2 tables
      const numTables = Math.pow(2, topRounds - 1);
      
      // Take top players for the bracket
      const finalBracketSize = Math.min(bracketSize, playerStandings.length);
      const topPlayers = playerStandings.slice(0, finalBracketSize);
      
      if (topPlayers.length < 2) {
        return { success: false, error: 'Недостаточно игроков для создания топа' };
      }

      // Olympic system pairing formula:
      // At table K, places K and (2^N - K + 1) play
      // Example for TOP-8 (N=3):
      //   Table 1: place 1 vs place 8 (2^3 - 1 + 1 = 8)
      //   Table 2: place 2 vs place 7 (2^3 - 2 + 1 = 7)
      //   Table 3: place 3 vs place 6 (2^3 - 3 + 1 = 6)
      //   Table 4: place 4 vs place 5 (2^3 - 4 + 1 = 5)
      const matches: Match[] = [];
      
      for (let tableNum = 1; tableNum <= numTables; tableNum++) {
        const player1Index = tableNum - 1; // 0-based index for place K
        const player2Index = bracketSize - tableNum; // 0-based index for place (2^N - K + 1)
        
        const player1 = topPlayers[player1Index];
        const player2 = topPlayers[player2Index];
        
        matches.push({
          id: `match-${Date.now()}-${tableNum}`,
          player1Id: player1.player.id,
          player2Id: player2.player.id,
          tableNumber: tableNum,
          result: null
        });
      }
      
      return { success: true, matches };
    } else {
      // For subsequent TOP rounds, pair winners from previous round
      const previousRound = tournament.rounds?.[tournament.rounds.length - 1];
      if (!previousRound) {
        return { success: false, error: 'Предыдущий раунд не найден' };
      }
      
      // Get winners from previous round in table order
      const winners: { playerId: string, tableNumber: number }[] = [];
      previousRound.matches?.forEach(match => {
        let winnerId: string | null = null;
        if (match.result === 'win1') {
          winnerId = match.player1Id;
        } else if (match.result === 'win2') {
          winnerId = match.player2Id!;
        }
        
        if (winnerId) {
          winners.push({ playerId: winnerId, tableNumber: match.tableNumber || 1 });
        }
      });
      
      // Sort by table number to maintain bracket structure
      winners.sort((a, b) => a.tableNumber - b.tableNumber);
      
      if (winners.length < 2) {
        return { success: false, error: 'Недостаточно победителей для следующего раунда' };
      }
      
      // Olympic bracket pairing formula for subsequent rounds:
      // For round N: table K plays winner of pair K vs winner of pair (2^(topRounds - N + 1) - K + 1)
      // Where pairs are numbered by their table numbers from previous round
      const matches: Match[] = [];
      const numTablesInCurrentRound = winners.length / 2;
      
      for (let k = 1; k <= numTablesInCurrentRound; k++) {
        // Calculate opponent pair number using Olympic system formula
        const opponentPairNum = Math.pow(2, topRounds - topRoundNumber + 1) - k + 1;
        
        // Get winners from these pairs (table numbers from previous round)
        const player1 = winners[k - 1]; // Winner from pair K (0-based index)
        const player2 = winners[opponentPairNum - 1]; // Winner from opponent pair (0-based index)
        
        matches.push({
          id: `match-${Date.now()}-${k}`,
          player1Id: player1.playerId,
          player2Id: player2.playerId,
          tableNumber: k,
          result: null
        });
      }
      
      return { success: true, matches };
    }
  }, []);

  // Generate pairings for next tournament round using Swiss system or elimination brackets
  const generatePairings = useCallback((tournamentId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return { success: false, error: 'Турнир не найден' };
    }

    if (tournament.participants.length < 2) {
      return { success: false, error: 'Недостаточно участников для создания пар' };
    }

    // Get players data, excluding dropped players
    const droppedPlayerIds = new Set(tournament.droppedPlayerIds || []);
    const activePlayers = tournament.participants.filter(playerId => !droppedPlayerIds.has(playerId));
    
    if (activePlayers.length < 2) {
      return { success: false, error: 'Недостаточно активных участников для создания пар (некоторые игроки дропнули)' };
    }
    
    const participants = activePlayers.map(playerId => 
      appState.players.find(p => p.id === playerId)
    ).filter(Boolean) as Player[];

    if (participants.length !== activePlayers.length) {
      return { success: false, error: 'Не все участники найдены в базе игроков' };
    }

    // Check if this is a TOP round (elimination bracket)
    const nextRoundNumber = tournament.currentRound + 1;
    const isTopRound = nextRoundNumber > tournament.swissRounds;
    
    if (isTopRound) {
      return generateTopPairings(tournament, participants, nextRoundNumber);
    }

    // Calculate current standings for each player
    const playerStandings = participants.map(player => {
      let points = 0;
      const opponents: string[] = [];
      let hasByeInTournament = false;

      // Go through all completed rounds to calculate points and track opponents
      tournament.rounds?.forEach(round => {
        const match = round.matches?.find(m => 
          m.player1Id === player.id || m.player2Id === player.id
        );
        
        if (match) {
          if (!match.player2Id) {
            // This was a bye
            points += 3;
            hasByeInTournament = true;
          } else if (match.result) {
            const isPlayer1 = match.player1Id === player.id;
            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
            opponents.push(opponentId);

            if (match.result === 'draw') {
              points += 1;
            } else if (
              (match.result === 'win1' && isPlayer1) ||
              (match.result === 'win2' && !isPlayer1)
            ) {
              points += 3;
            }
          }
        }
      });

      return {
        player,
        points,
        opponents,
        hasByeInTournament
      };
    });

    // Helper function to try pairing with given strategy
    const tryPairing = (standings: typeof playerStandings, byePlayer: string | null): Match[] | null => {
      const matches: Match[] = [];
      const paired = new Set<string>();
      let tableNumber = 1;

      // Mark bye player as paired but don't add match yet
      if (byePlayer) {
        paired.add(byePlayer);
      }

      // Pair remaining players
      for (let i = 0; i < standings.length; i++) {
        if (paired.has(standings[i].player.id)) continue;

        const player1Standing = standings[i];
        let foundOpponent = false;

        // Look for an opponent who hasn't played against this player
        for (let j = i + 1; j < standings.length; j++) {
          if (paired.has(standings[j].player.id)) continue;

          const player2Standing = standings[j];
          
          // Check if they haven't played against each other
          if (!player1Standing.opponents.includes(player2Standing.player.id)) {
            // Create match
            const match: Match = {
              id: `match-${Date.now()}-${tableNumber}`,
              player1Id: player1Standing.player.id,
              player2Id: player2Standing.player.id,
              points1: 0,
              points2: 0,
              tableNumber: tableNumber++
            };
            
            matches.push(match);
            paired.add(player1Standing.player.id);
            paired.add(player2Standing.player.id);
            foundOpponent = true;
            break;
          }
        }

        // If no valid opponent found - pairing failed
        if (!foundOpponent && !paired.has(player1Standing.player.id)) {
          return null;
        }
      }

      // Add bye match at the end (after all regular matches)
      if (byePlayer) {
        const byeMatch: Match = {
          id: `match-${Date.now()}-bye`,
          player1Id: byePlayer,
          player2Id: undefined,
          points1: 3,
          points2: 0,
          tableNumber: undefined,
          result: 'win1'
        };
        matches.push(byeMatch);
      }

      return matches;
    };

    // ALWAYS shuffle players before pairing to randomize order
    const shuffled = [...playerStandings];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Check if odd number of players - assign bye
    let byePlayerId: string | null = null;
    if (shuffled.length % 2 === 1) {
      if (tournament.currentRound === 0) {
        // Round 1: random player gets bye (already shuffled, take first)
        byePlayerId = shuffled[0].player.id;
      } else {
        // Later rounds: Sort by points to find bye candidate (lowest points, no previous bye)
        const sortedForBye = [...shuffled].sort((a, b) => a.points - b.points);
        
        // Try to find player without bye
        const byeCandidate = sortedForBye.find(p => !p.hasByeInTournament);
        
        if (byeCandidate) {
          byePlayerId = byeCandidate.player.id;
        } else {
          // All had byes, give to lowest points
          byePlayerId = sortedForBye[0].player.id;
        }
      }
    }

    let matches: Match[] | null = null;

    // For round 1: use shuffled order
    if (tournament.currentRound === 0) {
      matches = tryPairing(shuffled, byePlayerId);
    } else {
      // Strategy 1: Sort shuffled players by points descending (standard Swiss)
      const sortedByPoints = [...shuffled].sort((a, b) => b.points - a.points);
      matches = tryPairing(sortedByPoints, byePlayerId);

      // Strategy 2: If failed, try optimized pairing (minimize point difference)
      if (!matches) {
        // Create all possible pairings and find best one
        const playersWithoutBye = playerStandings.filter(p => p.player.id !== byePlayerId);
        
        // Generate all possible valid pairings
        const validPairings = generateAllValidPairings(playersWithoutBye);
        
        if (validPairings.length > 0) {
          // Sort by total point difference (ascending)
          validPairings.sort((a, b) => a.totalDiff - b.totalDiff);
          
          // Use best pairing
          const bestPairing = validPairings[0];
          matches = [];
          
          let tableNumber = 1;
          for (const pair of bestPairing.pairs) {
            matches.push({
              id: `match-${Date.now()}-${tableNumber}`,
              player1Id: pair.player1.player.id,
              player2Id: pair.player2.player.id,
              points1: 0,
              points2: 0,
              tableNumber: tableNumber++
            });
          }
          
          // Add bye match at the end with last table number
          if (byePlayerId) {
            const byeTableNumber = bestPairing.pairs.length + 1;
            matches.push({
              id: `match-${Date.now()}-bye`,
              player1Id: byePlayerId,
              player2Id: undefined,
              points1: 3,
              points2: 0,
              tableNumber: byeTableNumber,
              result: 'win1'
            });
          }
        }
      }
    }

    // Helper function to generate all valid pairings
    function generateAllValidPairings(players: typeof playerStandings): Array<{pairs: Array<{player1: typeof playerStandings[0], player2: typeof playerStandings[0]}>, totalDiff: number}> {
      const results: Array<{pairs: Array<{player1: typeof playerStandings[0], player2: typeof playerStandings[0]}>, totalDiff: number}> = [];
      
      function backtrack(remaining: typeof playerStandings, currentPairs: Array<{player1: typeof playerStandings[0], player2: typeof playerStandings[0]}>) {
        if (remaining.length === 0) {
          // Calculate total point difference
          const totalDiff = currentPairs.reduce((sum, pair) => 
            sum + Math.abs(pair.player1.points - pair.player2.points), 0
          );
          results.push({ pairs: [...currentPairs], totalDiff });
          return;
        }
        
        if (remaining.length === 1) return; // Invalid state
        
        const player1 = remaining[0];
        
        for (let i = 1; i < remaining.length; i++) {
          const player2 = remaining[i];
          
          // Check if valid pairing (haven't played before)
          if (!player1.opponents.includes(player2.player.id)) {
            const newRemaining = remaining.filter((_, idx) => idx !== 0 && idx !== i);
            backtrack(newRemaining, [...currentPairs, { player1, player2 }]);
          }
        }
      }
      
      backtrack(players, []);
      return results;
    }

    if (!matches) {
      return { success: false, error: 'Невозможно создать пары: все возможные комбинации приводят к повторным встречам' };
    }

    // Sort matches by total points (player1 + player2) descending, then assign table numbers
    // This ensures players with more points get lower table numbers (table 1, 2, 3...)
    if (tournament.currentRound > 0) {
      // Separate bye matches from regular matches
      const byeMatches = matches.filter(m => !m.player2Id);
      const regularMatches = matches.filter(m => m.player2Id);
      
      // Calculate total points for each match and sort
      const matchesWithPoints = regularMatches.map(match => {
        const player1Standing = playerStandings.find(p => p.player.id === match.player1Id);
        const player2Standing = playerStandings.find(p => p.player.id === match.player2Id);
        const totalPoints = (player1Standing?.points || 0) + (player2Standing?.points || 0);
        return { match, totalPoints };
      });
      
      // Sort by total points descending (higher points = lower table number)
      matchesWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);
      
      // Reassign table numbers starting from 1
      matchesWithPoints.forEach(({ match }, index) => {
        match.tableNumber = index + 1;
      });
      
      // Combine back: regular matches with table numbers + bye matches (no table number)
      matches = [...matchesWithPoints.map(m => m.match), ...byeMatches];
    }

    return { success: true, matches };
  }, [appState.tournaments, appState.players]);

  const createSeatingRound = useCallback(async (tournamentId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    console.log('🎯 Создание рассадки для турнира:', { id: tournament.id, dbId: tournament.dbId, name: tournament.name });
    
    if (!tournament.hasSeating) {
      alert('У этого турнира нет признака рассадки');
      return;
    }
    
    if (tournament.currentRound !== 0 || tournament.rounds?.length > 0) {
      alert('Рассадку можно создать только до первого тура');
      return;
    }
    
    const participants = tournament.participants
      .map(playerId => appState.players.find(p => p.id === playerId))
      .filter(Boolean) as Player[];
    
    if (participants.length < 2) {
      alert('Недостаточно участников для рассадки');
      return;
    }
    
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
    
    const matches: Match[] = [];
    const hasOddPlayers = shuffledParticipants.length % 2 === 1;
    const maxTableNumber = Math.ceil(shuffledParticipants.length / 2);
    
    let tableNumber = 1;
    
    for (let i = 0; i < shuffledParticipants.length; i += 2) {
      const player1 = shuffledParticipants[i];
      const player2 = shuffledParticipants[i + 1];
      
      if (player2) {
        matches.push({
          id: `seating-match-${Date.now()}-${tableNumber}`,
          player1Id: player1.id,
          player2Id: player2.id,
          tableNumber,
          points1: 0,
          points2: 0,
          result: undefined
        });
        tableNumber++;
      } else {
        matches.push({
          id: `seating-match-${Date.now()}-bye`,
          player1Id: player1.id,
          player2Id: undefined,
          tableNumber: maxTableNumber,
          points1: 0,
          points2: 0,
          result: undefined
        });
      }
    }
    
    const seatingRound: Round = {
      id: `round-seating-${Date.now()}`,
      number: 0,
      matches,
      isCompleted: true
    };
    
    // Save to database first
    if (tournament.dbId) {
      try {
        const pairings = seatingRound.matches.map(match => ({
          player1_id: match.player1Id,
          player2_id: match.player2Id || null
        }));
        
        console.log('📤 Сохранение рассадки в БД:', {
          tournament_id: tournament.dbId,
          round_number: 0,
          pairings
        });
        
        const response = await fetch('https://functions.poehali.dev/f701e507-6542-4d30-be94-8bcad260ece0', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            tournament_id: tournament.dbId,
            round_number: 0,
            pairings
          })
        });
        
        if (response.ok) {
          console.log('✅ Рассадка сохранена в БД');
        } else {
          console.error('❌ Ошибка сохранения рассадки в БД:', await response.text());
        }
      } catch (error) {
        console.error('❌ Ошибка подключения к БД при сохранении рассадки:', error);
      }
    } else {
      console.warn('⚠️ Турнир не имеет dbId, рассадка не сохранена в БД');
    }
    
    // Update local state
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t =>
        t.id === tournamentId
          ? {
              ...t,
              rounds: [seatingRound]
            }
          : t
      )
    }));
  }, [appState.tournaments, appState.players]);

  return {
    // State
    appState,
    
    // Navigation
    navigateTo,
    
    // Tournament data loading
    loadTournamentWithGames,
    
    // Auth
    showLoginForm,
    hideLoginForm,
    setCurrentUser,
    logout,
    
    // User management
    toggleUserStatus,
    updateUserRole,
    deleteUser,
    addUser,
    updateUser,
    
    // Player management
    addPlayer,
    deletePlayer,
    updatePlayer,
    updatePlayersStats,
    syncDbUsersToPlayers,
    
    // City management
    addCity,
    deleteCity,
    updateCity,
    
    // Tournament format management
    addTournamentFormat,
    deleteTournamentFormat,
    updateTournamentFormat,
    
    // Tournament management
    addTournament,
    deleteTournament,
    updateTournament,
    updateTournaments,
    addTournamentRound,
    updateMatchResult,
    togglePlayerDrop,
    updateRoundMatches,
    deleteLastRound,
    finishTournament,
    confirmTournament,
    confirmTournamentWithPlayerUpdates,
    generatePairings,
    createSeatingRound,
    
    // Raw state setter (for complex updates)
    setAppState,
    
    // Debug function to reset data
    resetToInitialState: () => {
      localStorage.removeItem('tournament-manager-state');
      setAppState(getInitialState());
    },
  };
};