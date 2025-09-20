import { useState, useEffect, useCallback } from 'react';
import type { AppState, User, Player, City, TournamentFormat, Tournament, Page, Round, Match } from '@/types';
import { saveStateToLocalStorage, loadStateFromLocalStorage } from '@/utils/storage';
import { getInitialState } from '@/utils/initialState';
import { api } from '@/utils/api';

export const useAppState = () => {
  // Load initial state from localStorage or use default
  const [appState, setAppState] = useState<AppState>(() => {
    const savedState = loadStateFromLocalStorage();
    if (savedState) {
      // Migrate old tournaments to include judgeId field
      const migratedState = {
        ...savedState,
        tournaments: (savedState.tournaments || []).map((tournament: any) => ({
          ...tournament,
          judgeId: tournament.judgeId || 'admin' // Default to admin if missing
        }))
      };
      return migratedState;
    }
    return getInitialState();
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

    // Update tournament and players
    confirmTournamentWithPlayerUpdates(tournamentId, { confirmed: true }, ratingChanges);
  }, [appState.tournaments, appState.players, confirmTournamentWithPlayerUpdates]);

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