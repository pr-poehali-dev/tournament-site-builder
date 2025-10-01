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
