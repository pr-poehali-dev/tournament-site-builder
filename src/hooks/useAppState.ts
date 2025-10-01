import { useState, useEffect, useCallback } from 'react';
import type { AppState, UIState, User, Player, City, TournamentFormat, Tournament, Page, Round, Match } from '@/types';
import { saveUIStateToLocalStorage, loadUIStateFromLocalStorage, clearOldLocalStorage } from '@/utils/storage';
import { getInitialState } from '@/utils/initialState';
import { api } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

export const useAppState = () => {
  // Load only UI state from localStorage
  const [appState, setAppState] = useState<AppState>(() => {
    const savedUIState = loadUIStateFromLocalStorage();
    const initialState = getInitialState();
    
    // Clear old full state from localStorage
    clearOldLocalStorage();
    
    if (savedUIState) {
      return {
        ...initialState,
        currentUser: savedUIState.currentUser,
        currentPage: savedUIState.currentPage,
        showLogin: savedUIState.showLogin
      };
    }
    return initialState;
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

  // Load tournaments from database on app start
  useEffect(() => {
    const loadTournamentsFromDatabase = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const tournamentsFromDb = data.tournaments.map((t: any) => {
            // Map database status to frontend status
            let frontendStatus: 'draft' | 'active' | 'completed' = 'draft';
            if (t.status === 'active') frontendStatus = 'active';
            else if (t.status === 'completed') frontendStatus = 'completed';
            else frontendStatus = 'draft'; // 'setup' or any other value maps to 'draft'
            
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
              judgeId: t.judge_id ? t.judge_id.toString() : ''
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
    setAppState(prev => ({ ...prev, currentUser: null, showLogin: false, currentPage: 'rating' }));
  };

  // User management functions
  const toggleUserStatus = (userId: string) => {
    setAppState(prev => ({
      ...prev,
      users: prev.users.map(user =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    }));
  };

  const deleteUser = (userId: string) => {
    setAppState(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== userId),
      // Также удаляем связанного игрока, если он существует
      players: prev.players.filter(player => player.id !== `player-${userId}`)
    }));
  };

  const addUser = async (user: User) => {
    try {
      // Сохраняем пользователя в БД через backend API
      const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        password: user.password, // Сохраняем локально для UI
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
      rating: user.rating || 1200,
      tournaments: user.tournaments || 0,
      wins: user.wins || 0,
      losses: user.losses || 0,
      draws: user.draws || 0
    }));

    // Преобразуем пользователей из БД в формат User
    const usersFromDb = dbUsers.map(user => ({
      id: user.id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
      city: user.city || '',
      isActive: user.isActive !== false,
      password: '***' // Пароли не нужны в frontend
    }));

    setAppState(prev => {
      console.log('✅ Заменяем игроков данными из БД:', playersFromDb.length);
      console.log('✅ Заменяем пользователей данными из БД:', usersFromDb.length);
      
      return {
        ...prev,
        players: playersFromDb, // Полностью заменяем игроков данными из БД
        users: usersFromDb // Полностью заменяем пользователей данными из БД
      };
    });
  }, []);

  // Global DB sync on app start
  useEffect(() => {
    const loadUsersFromDatabase = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const usersFromDb = data.users.map(user => ({
            id: user.id.toString(),
            username: user.username,
            name: user.name,
            role: user.role,
            city: user.city,
            isActive: user.is_active,
            password: '***'
          }));
          
          console.log('🔄 Глобальная синхронизация пользователей из БД:', usersFromDb.length);
          syncDbUsersToPlayers(usersFromDb);
        }
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить пользователей из БД при инициализации:', error);
      }
    };

    loadUsersFromDatabase();
  }, [syncDbUsersToPlayers]); // Зависимость от функции синхронизации

  // City management functions
  const addCity = useCallback((city: City) => {
    setAppState(prev => ({
      ...prev,
      cities: [...prev.cities, city]
    }));
  }, []);

  const deleteCity = (cityId: string) => {
    setAppState(prev => ({
      ...prev,
      cities: prev.cities.filter(c => c.id !== cityId)
    }));
  };

  const updateCity = (cityId: string, updates: Partial<City>) => {
    const oldCity = appState.cities.find(c => c.id === cityId);
    const oldName = oldCity?.name;
    const newName = updates.name;

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
  };

  // Tournament format management functions
  const addTournamentFormat = (format: TournamentFormat) => {
    setAppState(prev => ({
      ...prev,
      tournamentFormats: [...prev.tournamentFormats, format]
    }));
  };

  const deleteTournamentFormat = (formatId: string) => {
    setAppState(prev => ({
      ...prev,
      tournamentFormats: prev.tournamentFormats.filter(f => f.id !== formatId)
    }));
  };

  const updateTournamentFormat = (formatId: string, updates: Partial<TournamentFormat>) => {
    setAppState(prev => ({
      ...prev,
      tournamentFormats: prev.tournamentFormats.map(format =>
        format.id === formatId ? { ...format, ...updates } : format
      )
    }));
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
          headers: { 'Content-Type': 'application/json' }
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

      // Calculate currentRound
      const currentRound = rounds.length;

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
          player2_id: match.player2Id ? parseInt(match.player2Id) : null
        }));
        
        console.log('📤 Сохранение пар в БД:', {
          tournament_id: tournament.dbId,
          round_number: newRound.number,
          pairings
        });
        
        const response = await fetch('https://functions.poehali.dev/f701e507-6542-4d30-be94-8bcad260ece0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
              headers: { 'Content-Type': 'application/json' },
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

  const togglePlayerDrop = useCallback((tournamentId: string, playerId: string) => {
    setAppState(prev => {
      const tournament = prev.tournaments.find(t => t.id === tournamentId);
      if (!tournament) return prev;

      const droppedPlayers = new Set(tournament.droppedPlayerIds || []);
      
      if (droppedPlayers.has(playerId)) {
        droppedPlayers.delete(playerId);
      } else {
        droppedPlayers.add(playerId);
      }

      return {
        ...prev,
        tournaments: prev.tournaments.map(t =>
          t.id === tournamentId
            ? { ...t, droppedPlayerIds: Array.from(droppedPlayers) }
            : t
        )
      };
    });
  }, []);

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
            headers: { 'Content-Type': 'application/json' }
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
          headers: { 'Content-Type': 'application/json' },
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
  const confirmTournament = useCallback((tournamentId: string) => {
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

    // Send batch update to backend
    toast({
      title: "Сохранение рейтингов...",
      description: "Обновляем данные игроков в базе данных",
    });

    fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792?batch=true', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    })
      .then(response => response.json())
      .then(data => {
        console.log('✅ Рейтинги обновлены в БД:', data);
        
        toast({
          title: "✅ Рейтинги сохранены",
          description: `Обновлено игроков: ${data.updated_count || updates.length}`,
        });
        
        // Reload users from DB to sync the latest ratings
        return fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792');
      })
      .then(response => response?.json())
      .then(data => {
        if (data?.users) {
          console.log('✅ Обновлены данные игроков из БД после подтверждения турнира');
          syncDbUsersToPlayers(data.users);
        }
      })
      .catch(error => {
        console.error('❌ Ошибка обновления рейтингов в БД:', error);
        
        toast({
          title: "❌ Ошибка сохранения",
          description: "Не удалось сохранить рейтинги в базу данных",
          variant: "destructive",
        });
      });

    // Update tournament and players in local state
    confirmTournamentWithPlayerUpdates(tournamentId, { confirmed: true }, ratingChanges);
  }, [appState.tournaments, appState.players, confirmTournamentWithPlayerUpdates, syncDbUsersToPlayers]);

  // Generate TOP elimination bracket pairings (Olympic system)
  const generateTopPairings = useCallback((tournament: Tournament, participants: Player[], nextRoundNumber: number) => {
    // Calculate final Swiss standings
    const playerStandings = participants.map(player => {
      let points = 0;

      // Go through all Swiss rounds to calculate points
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

      return { player, points };
    });

    // Sort by points (descending) to get final Swiss standings
    playerStandings.sort((a, b) => b.points - a.points);

    // Determine bracket size based on topRounds (Olympic system)
    const topRounds = tournament.topRounds;
    const bracketSize = Math.pow(2, topRounds); // 2^topRounds players in first TOP round
    
    // Current TOP round number (1-based) - based on the round we're creating
    const topRoundNumber = nextRoundNumber - tournament.swissRounds;
    
    // If this is the first TOP round, create bracket from Swiss standings
    if (topRoundNumber === 1) {
      // For Olympic system, take exact bracket size based on topRounds
      // 3 topRounds = TOP-8 (8 players), 2 topRounds = TOP-4 (4 players), etc.
      const finalBracketSize = Math.min(bracketSize, playerStandings.length);
      
      const topPlayers = playerStandings.slice(0, finalBracketSize);
      
      if (topPlayers.length < 2) {
        return { success: false, error: 'Недостаточно игроков для создания топа' };
      }

      // Olympic system pairing: 1 vs N, 2 vs N-1, 3 vs N-2, etc.
      const matches: Match[] = [];
      let tableNumber = 1;
      
      for (let i = 0; i < topPlayers.length / 2; i++) {
        const player1 = topPlayers[i];
        const player2 = topPlayers[topPlayers.length - 1 - i];
        
        matches.push({
          id: `match-${Date.now()}-${tableNumber}`,
          player1Id: player1.player.id,
          player2Id: player2.player.id,
          tableNumber: tableNumber++,
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
      
      // Olympic system pairing for next round:
      // Classic Olympic system: pair winners based on bracket structure
      const matches: Match[] = [];
      let tableNumber = 1;
      
      // Olympic system: pair 1st table winner with last table winner, 2nd with 2nd-to-last, etc.
      for (let i = 0; i < winners.length / 2; i++) {
        const player1 = winners[i];
        const player2 = winners[winners.length - 1 - i];
        
        matches.push({
          id: `match-${Date.now()}-${tableNumber}`,
          player1Id: player1.playerId,
          player2Id: player2.playerId,
          tableNumber: tableNumber++,
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

      // First, add bye match if needed
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

      return matches;
    };

    // Check if odd number of players - assign bye first
    let byePlayerId: string | null = null;
    if (playerStandings.length % 2 === 1) {
      // Sort by points to find bye candidate (lowest points, no previous bye)
      const sortedForBye = [...playerStandings].sort((a, b) => a.points - b.points);
      
      // Try to find player without bye
      const byeCandidate = sortedForBye.find(p => !p.hasByeInTournament);
      
      if (byeCandidate) {
        byePlayerId = byeCandidate.player.id;
      } else {
        // All had byes, give to lowest points
        byePlayerId = sortedForBye[0].player.id;
      }
    }

    let matches: Match[] | null = null;

    // For round 1: random shuffle
    if (tournament.currentRound === 0) {
      // First round - random shuffle
      const shuffled = [...playerStandings];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      matches = tryPairing(shuffled, byePlayerId);
    } else {
      // Strategy 1: Sort by points descending (standard Swiss)
      const sortedByPoints = [...playerStandings].sort((a, b) => b.points - a.points);
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
          
          if (byePlayerId) {
            matches.push({
              id: `match-${Date.now()}-bye`,
              player1Id: byePlayerId,
              player2Id: undefined,
              points1: 3,
              points2: 0,
              tableNumber: undefined,
              result: 'win1'
            });
          }
          
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

    return { success: true, matches };
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
    
    // Raw state setter (for complex updates)
    setAppState,
    
    // Debug function to reset data
    resetToInitialState: () => {
      localStorage.removeItem('tournament-manager-state');
      setAppState(getInitialState());
    },
  };
};