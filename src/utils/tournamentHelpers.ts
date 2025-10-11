export const getTopStatus = (tournament: any, playerId: string): string => {
  if (
    tournament.topRounds === 0 ||
    tournament.currentRound <= tournament.swissRounds
  ) {
    return "";
  }

  let furthestRound = 0;
  let isStillActive = false;
  let wonLastMatch = false;

  tournament.rounds?.forEach((round: any) => {
    if (round.number > tournament.swissRounds) {
      const match = round.matches?.find(
        (m: any) => m.player1Id === playerId || m.player2Id === playerId,
      );

      if (match) {
        furthestRound = round.number;

        if (match.result) {
          const isPlayer1 = match.player1Id === playerId;
          wonLastMatch =
            (match.result === "win1" && isPlayer1) ||
            (match.result === "win2" && !isPlayer1);
          isStillActive = wonLastMatch;
        } else {
          isStillActive = true;
          wonLastMatch = false;
        }
      }
    }
  });

  if (furthestRound === 0) {
    return "-";
  }

  const topRoundNumber = furthestRound - tournament.swissRounds;
  const totalTopRounds = tournament.topRounds;

  if (isStillActive) {
    if (totalTopRounds - topRoundNumber + 1 === 2) {
      return "🏆 Финалист";
    } else if (totalTopRounds - topRoundNumber + 1 === 4) {
      return "🏆 Финалист";
    } else {
      const playersInThisRound = Math.pow(
        2,
        totalTopRounds - topRoundNumber + 1,
      );
      return `🏆 Финалист`;
    }
  } else {
    const playersInPreviousRound = Math.pow(
      2,
      totalTopRounds - topRoundNumber + 2,
    );
    if (playersInPreviousRound === 4) {
      return "🥉 Полуфиналист";
    } else if (playersInPreviousRound === 2) {
      return "🥈 Вице-чемпион";
    } else {
      return `ТОП-${playersInPreviousRound / 2}`;
    }
  }
};

export const sortByTopResults = (a: any, b: any, tournament: any, users: any[]) => {
  const getTopPerformance = (playerId: string) => {
    let furthestRound = 0;
    let isStillActive = false;
    let wonLastMatch = false;

    tournament.rounds?.forEach((round: any) => {
      if (round.number > tournament.swissRounds) {
        const match = round.matches?.find(
          (m: any) => m.player1Id === playerId || m.player2Id === playerId,
        );

        if (match) {
          furthestRound = round.number;

          if (match.result) {
            const isPlayer1 = match.player1Id === playerId;
            wonLastMatch =
              (match.result === "win1" && isPlayer1) ||
              (match.result === "win2" && !isPlayer1);
            isStillActive = wonLastMatch;
          } else {
            isStillActive = true;
            wonLastMatch = false;
          }
        }
      }
    });

    if (furthestRound === 0) {
      return {
        furthestRound: tournament.swissRounds,
        isStillActive: false,
        madeToTop: false,
      };
    }

    return { furthestRound, isStillActive, madeToTop: true };
  };

  const playerA = getTopPerformance(a.user.id);
  const playerB = getTopPerformance(b.user.id);

  if (playerA.madeToTop !== playerB.madeToTop) {
    return playerB.madeToTop ? 1 : -1;
  }

  if (playerA.madeToTop && playerB.madeToTop) {
    if (playerA.furthestRound !== playerB.furthestRound) {
      return playerB.furthestRound - playerA.furthestRound;
    }

    if (playerA.isStillActive !== playerB.isStillActive) {
      return playerB.isStillActive ? 1 : -1;
    }
  }

  if (a.points !== b.points) {
    return b.points - a.points;
  }

  if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;

  return b.sumBuchholz - a.sumBuchholz;
};

export const getRoundName = (tournament: any, roundNumber: number): string => {
  // Рассадочный тур имеет номер 0
  if (roundNumber === 0) {
    return "Рассадка";
  }
  
  if (roundNumber <= tournament.swissRounds) {
    return `${roundNumber} тур`;
  } else {
    const topRoundNumber = roundNumber - tournament.swissRounds;
    const totalTopRounds = tournament.topRounds;
    const playersInThisRound = Math.pow(2, totalTopRounds - topRoundNumber + 1);

    if (playersInThisRound === 2) {
      return "Финал";
    } else if (playersInThisRound === 4) {
      return "Полуфинал";
    } else {
      return `ТОП-${playersInThisRound}`;
    }
  }
};

export const calculateTournamentStandings = (
  tournament: any,
  users: any[],
) => {
  const droppedPlayerIds = new Set(tournament.droppedPlayerIds || []);
  
  return tournament.participants
    .map((participantId: string) => {
      const user = users.find((u: any) => u.id === participantId);
      if (!user) return null;

      let points = 0;
      let wins = 0;
      let losses = 0;
      let draws = 0;
      const opponentIds: string[] = [];
      let dropRoundNumber: number | null = null;

      // Determine when player was dropped (if at all)
      if (droppedPlayerIds.has(participantId)) {
        tournament.rounds?.forEach((round: any, index: number) => {
          const match = round.matches?.find(
            (m: any) => m.player1Id === participantId || m.player2Id === participantId
          );
          // If player is not in matches of this round, they dropped before/during it
          if (!match && dropRoundNumber === null) {
            dropRoundNumber = round.number;
          }
        });
      }

      tournament.rounds?.forEach((round: any) => {
        // Пропускаем рассадочный тур (не учитывается в подсчёте очков)
        if (round.number === 0) {
          return;
        }
        
        if (round.number <= tournament.swissRounds) {
          // Skip rounds after player dropped
          if (dropRoundNumber !== null && round.number >= dropRoundNumber) {
            return;
          }
          
          const match = round.matches?.find(
            (m: any) =>
              m.player1Id === participantId || m.player2Id === participantId,
          );
          if (match) {
            if (!match.player2Id) {
              points += 3;
              wins += 1;
            } else if (match.result) {
              const isPlayer1 = match.player1Id === participantId;
              const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
              opponentIds.push(opponentId);

              if (match.result === "draw") {
                points += 1;
                draws += 1;
              } else if (
                (match.result === "win1" && isPlayer1) ||
                (match.result === "win2" && !isPlayer1)
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
        tournament.rounds?.forEach((round: any) => {
          // Пропускаем рассадочный тур
          if (round.number === 0) {
            return;
          }
          
          if (round.number <= tournament.swissRounds) {
            const opponentMatch = round.matches?.find(
              (m: any) =>
                m.player1Id === opponentId || m.player2Id === opponentId,
            );
            if (opponentMatch) {
              if (!opponentMatch.player2Id) {
                opponentPoints += 3;
              } else if (opponentMatch.result) {
                const isOpponentPlayer1 = opponentMatch.player1Id === opponentId;
                if (opponentMatch.result === "draw") {
                  opponentPoints += 1;
                } else if (
                  (opponentMatch.result === "win1" && isOpponentPlayer1) ||
                  (opponentMatch.result === "win2" && !isOpponentPlayer1)
                ) {
                  opponentPoints += 3;
                }
              }
            }
          }
        });
        return acc + opponentPoints;
      }, 0);

      const sumBuchholz = opponentIds.reduce((acc, opponentId) => {
        let opponentBuchholz = 0;

        const opponentOpponentIds: string[] = [];
        tournament.rounds?.forEach((round: any) => {
          // Пропускаем рассадочный тур
          if (round.number === 0) {
            return;
          }
          
          if (round.number <= tournament.swissRounds) {
            const opponentMatch = round.matches?.find(
              (m: any) =>
                m.player1Id === opponentId || m.player2Id === opponentId,
            );
            if (opponentMatch && opponentMatch.result) {
              if (!opponentMatch.player2Id) {
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
          tournament.rounds?.forEach((round: any) => {
            // Пропускаем рассадочный тур
            if (round.number === 0) {
              return;
            }
            
            if (round.number <= tournament.swissRounds) {
              const oppOppMatch = round.matches?.find(
                (m: any) =>
                  m.player1Id === oppOppId || m.player2Id === oppOppId,
              );
              if (oppOppMatch) {
                if (!oppOppMatch.player2Id) {
                  oppOppPoints += 3;
                } else if (oppOppMatch.result) {
                  const isOppOppPlayer1 = oppOppMatch.player1Id === oppOppId;
                  if (oppOppMatch.result === "draw") {
                    oppOppPoints += 1;
                  } else if (
                    (oppOppMatch.result === "win1" && isOppOppPlayer1) ||
                    (oppOppMatch.result === "win2" && !isOppOppPlayer1)
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

      const isDropped = droppedPlayerIds.has(participantId);

      return {
        user,
        points,
        wins,
        losses,
        draws,
        buchholz,
        sumBuchholz,
        isDropped,
      };
    })
    .filter((item: any) => item !== null)
    .sort((a: any, b: any) => {
      // Если турнир ещё не начался (нет реальных туров или currentRound === 0), сортируем по алфавиту
      const hasRealRounds = tournament.rounds?.some((r: any) => r.number > 0) || false;
      const tournamentStarted = tournament.currentRound > 0 && hasRealRounds;
      
      if (!tournamentStarted) {
        // Сортировка по алфавиту (по имени игрока)
        return a.user.name.localeCompare(b.user.name, 'ru');
      }
      
      // Иначе используем обычную сортировку по результатам
      return sortByTopResults(a, b, tournament, users);
    });
};