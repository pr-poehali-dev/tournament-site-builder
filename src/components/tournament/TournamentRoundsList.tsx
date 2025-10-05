import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { AppState, Tournament } from '@/types';
import { SeatingTable } from './SeatingTable';

interface TournamentRoundsListProps {
  tournament: Tournament;
  appState: AppState;
  updateMatchResult: (tournamentId: string, roundId: string, matchId: string, result: string) => void;
  togglePlayerDrop: (tournamentId: string, playerId: string) => void;
}

export const TournamentRoundsList: React.FC<TournamentRoundsListProps> = ({
  tournament,
  appState,
  updateMatchResult,
  togglePlayerDrop,
}) => {
  if (!tournament.rounds || tournament.rounds.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Туры турнира</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tournament.rounds?.map((round) => {
          if (round.number === 0) {
            return <SeatingTable key={round.id} round={round} users={appState.users} tournament={tournament} />;
          }
          
          return (
          <div key={round.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Тур {round.number}</h3>
              <Badge variant={round.isCompleted ? "default" : "secondary"}>
                {round.isCompleted ? "Завершён" : "В процессе"}
              </Badge>
            </div>

            <div className="space-y-2">
              {round.matches
                .sort((a, b) => {
                  // БАЙ в конец
                  if (!a.player2Id) return 1;
                  if (!b.player2Id) return -1;
                  // Остальные по номеру стола
                  return (a.tableNumber || 0) - (b.tableNumber || 0);
                })
                .map((match) => {
                const player1 = appState.users.find((u) => u.id === match.player1Id);
                const player2 = match.player2Id
                  ? appState.users.find((u) => u.id === match.player2Id)
                  : null;

                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-medium min-w-[60px]">
                        {match.player2Id ? `Стол ${match.tableNumber}` : "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{player1?.name || "Неизвестный игрок"}</span>
                        <span className="text-gray-500">vs</span>
                        <span>{player2?.name || "БАЙ"}</span>
                      </div>
                    </div>

                    {match.result ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {match.result === "win1" && (player1?.name || "Игрок 1")}
                          {match.result === "win2" && (player2?.name || "Игрок 2")}
                          {match.result === "draw" && "Ничья"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {match.points1}:{match.points2}
                        </span>
                        {tournament.rounds &&
                          round.number === tournament.rounds.length && (
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant={match.result === "win1" ? "default" : "outline"}
                                onClick={() =>
                                  updateMatchResult(
                                    tournament.id,
                                    round.id,
                                    match.id,
                                    "win1",
                                  )
                                }
                              >
                                3-0
                              </Button>
                              <Button
                                size="sm"
                                variant={match.result === "draw" ? "default" : "outline"}
                                onClick={() =>
                                  updateMatchResult(
                                    tournament.id,
                                    round.id,
                                    match.id,
                                    "draw",
                                  )
                                }
                              >
                                1-1
                              </Button>
                              <Button
                                size="sm"
                                variant={match.result === "win2" ? "default" : "outline"}
                                onClick={() =>
                                  updateMatchResult(
                                    tournament.id,
                                    round.id,
                                    match.id,
                                    "win2",
                                  )
                                }
                              >
                                0-3
                              </Button>
                            </div>
                          )}
                      </div>
                    ) : !match.player2Id ? (
                      <Badge variant="secondary">БАЙ</Badge>
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMatchResult(
                              tournament.id,
                              round.id,
                              match.id,
                              "win1",
                            )
                          }
                        >
                          3-0
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMatchResult(
                              tournament.id,
                              round.id,
                              match.id,
                              "draw",
                            )
                          }
                        >
                          1-1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMatchResult(
                              tournament.id,
                              round.id,
                              match.id,
                              "win2",
                            )
                          }
                        >
                          0-3
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
};