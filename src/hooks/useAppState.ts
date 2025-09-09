import { useState, useEffect, useCallback } from 'react';
import type { AppState, User, Player, City, TournamentFormat, Tournament, Page, Round, Match } from '@/types';
import { saveStateToLocalStorage, loadStateFromLocalStorage } from '@/utils/storage';
import { getInitialState } from '@/utils/initialState';

export const useAppState = () => {
  // Load initial state from localStorage or use default
  const [appState, setAppState] = useState<AppState>(() => {
    const savedState = loadStateFromLocalStorage();
    return savedState || getInitialState();
  });

  // Auto-save to localStorage whenever appState changes
  useEffect(() => {
    saveStateToLocalStorage(appState);
  }, [appState]);

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

  const addUser = (user: User) => {
    setAppState(prev => ({
      ...prev,
      users: [...prev.users, user]
    }));
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
  const addTournament = (tournament: Tournament) => {
    setAppState(prev => ({
      ...prev,
      tournaments: [...prev.tournaments, tournament]
    }));
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

  // Specific tournament operations
  const addTournamentRound = useCallback((tournamentId: string, newRound: Round) => {
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
  }, []);

  const updateMatchResult = useCallback((tournamentId: string, roundId: string, matchId: string, result: 'win1' | 'win2' | 'draw') => {
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
  }, []);

  const deleteLastRound = useCallback((tournamentId: string) => {
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(tournament =>
        tournament.id === tournamentId && tournament.rounds.length > 0
          ? {
              ...tournament,
              rounds: tournament.rounds.slice(0, -1), // Удаляем последний тур
              currentRound: tournament.currentRound - 1 // Уменьшаем счетчик туров
            }
          : tournament
      )
    }));
  }, []);

  const finishTournament = useCallback((tournamentId: string) => {
    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t =>
        t.id === tournamentId
          ? { ...t, status: 'completed' as const }
          : t
      )
    }));
  }, []);

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
  const confirmTournamentWithPlayerUpdates = (tournamentId: string, tournamentUpdates: Partial<Tournament>, playersUpdates?: Map<string, Partial<Player>>) => {
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
  };

  // Generate pairings for next tournament round
  const generatePairings = useCallback((tournamentId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return { success: false, error: 'Турнир не найден' };
    }

    if (tournament.participants.length < 2) {
      return { success: false, error: 'Недостаточно участников для создания пар' };
    }

    // Get players data
    const participants = tournament.participants.map(playerId => 
      appState.players.find(p => p.id === playerId)
    ).filter(Boolean) as Player[];

    if (participants.length !== tournament.participants.length) {
      return { success: false, error: 'Не все участники найдены в базе игроков' };
    }

    // Simple pairing algorithm: shuffle players and pair them
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches: Match[] = [];
    
    for (let i = 0; i < shuffled.length; i += 2) {
      const player1 = shuffled[i];
      const player2 = shuffled[i + 1];
      
      const match: Match = {
        id: `match-${Date.now()}-${i}`,
        player1Id: player1.id,
        player2Id: player2?.id,
        points1: 0,
        points2: 0,
        tableNumber: Math.floor(i / 2) + 1
      };
      
      matches.push(match);
    }

    return { success: true, matches };
  }, [appState.tournaments, appState.players]);

  return {
    // State
    appState,
    
    // Navigation
    navigateTo,
    
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
    deleteLastRound,
    finishTournament,
    confirmTournamentWithPlayerUpdates,
    generatePairings,
    
    // Raw state setter (for complex updates)
    setAppState,
  };
};