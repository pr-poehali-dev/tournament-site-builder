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

  // Calculate rating changes and confirm tournament
  const confirmTournament = useCallback((tournamentId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament || tournament.status !== 'completed') return;

    // Calculate rating changes for each participant
    const ratingChanges = new Map<string, Partial<Player>>();
    
    tournament.participants.forEach(participantId => {
      const player = appState.players.find(p => p.id === participantId);
      if (!player) return;

      let wins = 0;
      let losses = 0;
      let draws = 0;

      // Count wins/losses/draws for this player
      tournament.rounds?.forEach(round => {
        const match = round.matches?.find(m => 
          m.player1Id === participantId || m.player2Id === participantId
        );
        
        if (match) {
          if (!match.player2Id) {
            // Bye - counts as win
            wins += 1;
          } else if (match.result) {
            const isPlayer1 = match.player1Id === participantId;
            if (match.result === 'draw') {
              draws += 1;
            } else if (
              (match.result === 'win1' && isPlayer1) ||
              (match.result === 'win2' && !isPlayer1)
            ) {
              wins += 1;
            } else {
              losses += 1;
            }
          }
        }
      });

      // Simple rating calculation: +10 per win, -5 per loss, +2 per draw
      const ratingChange = (wins * 10) - (losses * 5) + (draws * 2);
      
      ratingChanges.set(participantId, {
        rating: Math.max(0, player.rating + ratingChange),
        tournaments: player.tournaments + 1,
        wins: player.wins + wins,
        losses: player.losses + losses,
        draws: player.draws + draws
      });
    });

    // Update tournament and players
    confirmTournamentWithPlayerUpdates(tournamentId, { confirmed: true }, ratingChanges);
  }, [appState.tournaments, appState.players, confirmTournamentWithPlayerUpdates]);

  // Generate pairings for next tournament round using Swiss system
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

    // Calculate current standings for each player
    const playerStandings = participants.map(player => {
      let points = 0;
      let opponents: string[] = [];
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

    // Sort by points (descending)
    playerStandings.sort((a, b) => b.points - a.points);

    const matches: Match[] = [];
    const paired = new Set<string>();
    let tableNumber = 1;

    // Try to pair players starting from highest points
    for (let i = 0; i < playerStandings.length; i++) {
      if (paired.has(playerStandings[i].player.id)) continue;

      const player1Standing = playerStandings[i];
      let foundOpponent = false;

      // Look for an opponent with similar points who hasn't played against this player
      for (let j = i + 1; j < playerStandings.length; j++) {
        if (paired.has(playerStandings[j].player.id)) continue;

        const player2Standing = playerStandings[j];
        
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

      // If no opponent found and this player isn't paired, they might get a bye
      if (!foundOpponent && !paired.has(player1Standing.player.id)) {
        // Check if there's exactly one unpaired player left (this one)
        const unpairedCount = playerStandings.filter(p => !paired.has(p.player.id)).length;
        if (unpairedCount === 1) {
          // Give bye to the player with lowest points who hasn't had bye yet
          const unpairedPlayers = playerStandings.filter(p => !paired.has(p.player.id));
          const byeCandidate = unpairedPlayers
            .filter(p => !p.hasByeInTournament)
            .sort((a, b) => a.points - b.points)[0] || unpairedPlayers[0];

          const byeMatch: Match = {
            id: `match-${Date.now()}-bye`,
            player1Id: byeCandidate.player.id,
            player2Id: undefined,
            points1: 3,
            points2: 0,
            tableNumber: undefined,
            result: 'win1'
          };
          
          matches.push(byeMatch);
          paired.add(byeCandidate.player.id);
        }
      }
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
    confirmTournament,
    confirmTournamentWithPlayerUpdates,
    generatePairings,
    
    // Raw state setter (for complex updates)
    setAppState,
  };
};