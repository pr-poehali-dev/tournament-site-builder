import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AppState, Tournament } from '@/types';
import { getTopStatus, sortByTopResults } from '@/utils/tournamentHelpers';

interface TournamentStandingsProps {
  tournament: Tournament;
  appState: AppState;
}

export const TournamentStandings: React.FC<TournamentStandingsProps> = ({
  tournament,
  appState,
}) => {
  const participants = tournament.participants
    .map((participantId) => {
      const user = appState.users.find((u) => u.id === participantId);
      if (!user) return null;

      let points = 0;
      let wins = 0;
      let losses = 0;
      let draws = 0;
      const opponentIds: string[] = [];

      tournament.rounds?.forEach((round) => {
        if (round.number <= tournament.swissRounds) {
          const match = round.matches?.find(
            (m) =>
              m.player1Id === participantId || m.player2Id === participantId,
          );
          if (match) {
            if (!match.player2Id) {
              points += 3;
              wins += 1;
            } else if (match.result) {
              const isPlayer1 = match.player1Id === participantId;
              const opponentId = isPlayer1
                ? match.player2Id
                : match.player1Id;
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
        tournament.rounds?.forEach((round) => {
          if (round.number <= tournament.swissRounds) {
            const opponentMatch = round.matches?.find(
              (m) =>
                m.player1Id === opponentId || m.player2Id === opponentId,
            );
            if (opponentMatch) {
              if (!opponentMatch.player2Id) {
                opponentPoints += 3;
              } else if (opponentMatch.result) {
                const isOpponentPlayer1 =
                  opponentMatch.player1Id === opponentId;
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
        tournament.rounds?.forEach((round) => {
          if (round.number <= tournament.swissRounds) {
            const opponentMatch = round.matches?.find(
              (m) =>
                m.player1Id === opponentId || m.player2Id === opponentId,
            );
            if (opponentMatch && opponentMatch.result) {
              if (!opponentMatch.player2Id) {
              } else {
                const isOpponentPlayer1 =
                  opponentMatch.player1Id === opponentId;
                const opponentOpponentId = isOpponentPlayer1
                  ? opponentMatch.player2Id
                  : opponentMatch.player1Id;
                opponentOpponentIds.push(opponentOpponentId);
              }
            }
          }
        });

        opponentBuchholz = opponentOpponentIds.reduce(
          (oppAcc, oppOppId) => {
            let oppOppPoints = 0;
            tournament.rounds?.forEach((round) => {
              if (round.number <= tournament.swissRounds) {
                const oppOppMatch = round.matches?.find(
                  (m) =>
                    m.player1Id === oppOppId || m.player2Id === oppOppId,
                );
                if (oppOppMatch) {
                  if (!oppOppMatch.player2Id) {
                    oppOppPoints += 3;
                  } else if (oppOppMatch.result) {
                    const isOppOppPlayer1 =
                      oppOppMatch.player1Id === oppOppId;
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
          },
          0,
        );

        return acc + opponentBuchholz;
      }, 0);

      return {
        user,
        points,
        buchholz,
        sumBuchholz,
        wins,
        losses,
        draws,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (
        tournament.topRounds > 0 &&
        tournament.currentRound > tournament.swissRounds
      ) {
        return sortByTopResults(a!, b!, tournament, appState.users);
      }

      if (b!.points !== a!.points) return b!.points - a!.points;
      if (b!.buchholz !== a!.buchholz) return b!.buchholz - a!.buchholz;
      return b!.sumBuchholz - a!.sumBuchholz;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Турнирная таблица</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Место</th>
                <th className="text-left p-2 font-medium">Игрок</th>
                <th className="text-left p-2 font-medium">Очки</th>
                <th className="text-left p-2 font-medium">Бух.</th>
                <th className="text-left p-2 font-medium">Бух-2</th>
                <th className="text-left p-2 font-medium">П-Н-П</th>
                {tournament.topRounds > 0 &&
                  tournament.currentRound > tournament.swissRounds && (
                    <th className="text-left p-2 font-medium">Статус в топе</th>
                  )}
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => (
                <tr
                  key={participant!.user.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-2">
                    <Badge variant="outline">{index + 1}</Badge>
                  </td>
                  <td className="p-2 font-medium">{participant!.user.name}</td>
                  <td className="p-2">{participant!.points}</td>
                  <td className="p-2">{participant!.buchholz}</td>
                  <td className="p-2">{participant!.sumBuchholz}</td>
                  <td className="p-2 text-sm text-gray-600">
                    {participant!.wins}-{participant!.draws}-
                    {participant!.losses}
                  </td>
                  {tournament.topRounds > 0 &&
                    tournament.currentRound > tournament.swissRounds && (
                      <td className="p-2 text-sm">
                        <span className="font-medium">
                          {getTopStatus(tournament, participant!.user.id)}
                        </span>
                      </td>
                    )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
