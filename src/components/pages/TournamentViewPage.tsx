import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import type { AppState, Tournament, Page } from "@/types";

// Helper function to get player's TOP status
const getTopStatus = (tournament: Tournament, playerId: string): string => {
  if (
    tournament.topRounds === 0 ||
    tournament.currentRound <= tournament.swissRounds
  ) {
    return "";
  }

  // Find the furthest TOP round the player reached
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
          isStillActive = true; // Match not played yet
          wonLastMatch = false;
        }
      }
    }
  });

  if (furthestRound === 0) {
    return "Не прошёл в топ";
  }

  // Determine status based on furthest round reached and current status
  const topRoundNumber = furthestRound - tournament.swissRounds;
  const totalTopRounds = tournament.topRounds;

  // If player won their last match or match not played yet, they're still active
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
    // Player lost their last match
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

// Helper function to sort players by TOP tournament results
const sortByTopResults = (a: any, b: any, tournament: Tournament) => {
  // Find the furthest TOP round each player reached and their status
  const getTopPerformance = (playerId: string) => {
    let furthestRound = 0;
    let isStillActive = false;
    let wonLastMatch = false;

    // Find the furthest round the player participated in
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
            isStillActive = true; // Match not played yet
            wonLastMatch = false;
          }
        }
      }
    });

    // If player never played in TOP rounds, they didn't make it to TOP
    if (furthestRound === 0) {
      return {
        furthestRound: tournament.swissRounds, // Use Swiss rounds as baseline
        isStillActive: false,
        madeToTop: false,
      };
    }

    return { furthestRound, isStillActive, madeToTop: true };
  };

  const playerA = getTopPerformance(a.user.id);
  const playerB = getTopPerformance(b.user.id);

  // 1. Players who made it to TOP rank higher than those who didn't
  if (playerA.madeToTop !== playerB.madeToTop) {
    return playerB.madeToTop ? 1 : -1;
  }

  // 2. If both made to TOP, player who went further ranks higher
  if (playerA.madeToTop && playerB.madeToTop) {
    if (playerA.furthestRound !== playerB.furthestRound) {
      return playerB.furthestRound - playerA.furthestRound;
    }

    // 3. If same round reached, active player (still in tournament) ranks higher
    if (playerA.isStillActive !== playerB.isStillActive) {
      return playerB.isStillActive ? 1 : -1;
    }
  }

  // 4. If same TOP performance (or both didn't make TOP), use Swiss standings
  if (a.points !== b.points) {
    return b.points - a.points;
  }

  // 5. If same points, use Buchholz
  if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
  
  // 6. If same Buchholz, use Sum Buchholz
  return b.sumBuchholz - a.sumBuchholz;
};

// Helper function to get round name
const getRoundName = (tournament: Tournament, roundNumber: number): string => {
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

interface TournamentViewPageProps {
  appState: AppState;
  tournamentId: string;
  navigateTo: (page: Page) => void;
}

export const TournamentViewPage: React.FC<TournamentViewPageProps> = ({
  appState,
  tournamentId,
  navigateTo,
}) => {
  const currentUserId = appState.currentUser?.id || "";
  const tournament = appState.tournaments.find((t) => t.id === tournamentId);

  if (!tournament) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Icon name="Search" size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Турнир не найден</p>
            <Button
              onClick={() => navigateTo("my-tournaments")}
              className="mt-4"
            >
              Вернуться к моим турнирам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate final standings using the same logic as Index.tsx
  const calculateStandings = () => {
    return tournament.participants
      .map((participantId) => {
        const user = appState.users.find((u) => u.id === participantId);
        if (!user) return null;

        let points = 0;
        let wins = 0;
        let losses = 0;
        let draws = 0;
        let opponentIds: string[] = [];

        tournament.rounds?.forEach((round) => {
          // Only count Swiss rounds for points and Buchholz
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

        // Calculate Buchholz coefficient (sum of opponent points)
        const buchholz = opponentIds.reduce((acc, opponentId) => {
          let opponentPoints = 0;
          tournament.rounds?.forEach((round) => {
            // Only count Swiss rounds for Buchholz coefficient
            if (round.number <= tournament.swissRounds) {
              const opponentMatch = round.matches?.find(
                (m) => m.player1Id === opponentId || m.player2Id === opponentId,
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

        // Calculate Sum Buchholz coefficient (sum of opponent Buchholz coefficients)
        const sumBuchholz = opponentIds.reduce((acc, opponentId) => {
          // Calculate this opponent's Buchholz coefficient
          let opponentBuchholz = 0;
          
          // Get this opponent's opponents
          let opponentOpponentIds: string[] = [];
          tournament.rounds?.forEach((round) => {
            if (round.number <= tournament.swissRounds) {
              const opponentMatch = round.matches?.find(
                (m) => m.player1Id === opponentId || m.player2Id === opponentId,
              );
              if (opponentMatch && opponentMatch.result) {
                if (!opponentMatch.player2Id) {
                  // BYE - no additional opponents
                } else {
                  const isOpponentPlayer1 = opponentMatch.player1Id === opponentId;
                  const opponentOpponentId = isOpponentPlayer1 ? opponentMatch.player2Id : opponentMatch.player1Id;
                  opponentOpponentIds.push(opponentOpponentId);
                }
              }
            }
          });
          
          // Calculate opponent's Buchholz (sum of their opponent points)
          opponentBuchholz = opponentOpponentIds.reduce((oppAcc, oppOppId) => {
            let oppOppPoints = 0;
            tournament.rounds?.forEach((round) => {
              if (round.number <= tournament.swissRounds) {
                const oppOppMatch = round.matches?.find(
                  (m) => m.player1Id === oppOppId || m.player2Id === oppOppId,
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
        // Special sorting logic for tournaments with TOP rounds
        if (
          tournament.topRounds > 0 &&
          tournament.currentRound > tournament.swissRounds
        ) {
          return sortByTopResults(a!, b!, tournament);
        }

        // Standard Swiss system sorting
        if (b!.points !== a!.points) return b!.points - a!.points;
        if (b!.buchholz !== a!.buchholz) return b!.buchholz - a!.buchholz;
        return b!.sumBuchholz - a!.sumBuchholz;
      });
  };

  const standings = calculateStandings();

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Trophy" size={20} />
                {tournament.name}
                {tournament.confirmed && (
                  <Badge variant="secondary">Подтверждён</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {tournament.date} • {tournament.city} •{" "}
                {tournament.participants.length} участников
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => navigateTo("my-tournaments")}
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Формат</div>
              <div className="font-medium">
                {tournament.swissRounds > 0 && tournament.topRounds > 0
                  ? `Швейцарка ${tournament.swissRounds} + Топ ${tournament.topRounds}`
                  : tournament.swissRounds > 0
                    ? `Швейцарка ${tournament.swissRounds} туров`
                    : `Плей-офф ${tournament.topRounds} туров`}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Рейтинговый</div>
              <div className="font-medium">
                {tournament.isRated ? "Да" : "Нет"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Статус</div>
              <Badge
                variant={
                  tournament.status === "completed" ? "secondary" : "default"
                }
              >
                {tournament.status === "completed"
                  ? "Завершён"
                  : tournament.status === "active"
                    ? "Активный"
                    : "Черновик"}
              </Badge>
            </div>
            <div>
              <div className="text-muted-foreground">Судья</div>
              <div className="font-medium">
                {(() => {
                  const judge = appState.users.find(
                    (u) => u.id === tournament.judgeId,
                  );
                  return judge ? judge.name : "Не указан";
                })()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Туров проведено</div>
              <div className="font-medium">
                {tournament.rounds?.length || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Content */}
      <Tabs defaultValue="standings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="standings">Турнирная таблица</TabsTrigger>
          <TabsTrigger value="rounds">Туры</TabsTrigger>
        </TabsList>

        {/* Standings Tab */}
        <TabsContent value="standings">
          <Card>
            <CardHeader>
              <CardTitle>Турнирная таблица</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2 font-medium">Место</th>
                      <th className="text-left p-2 font-medium">Игрок</th>
                      <th className="text-left p-2 font-medium">Очки</th>
                      <th className="text-left p-2 font-medium">Бухгольц</th>
                      <th className="text-left p-2 font-medium">Сум. коэф. Бухгольца</th>
                      <th className="text-left p-2 font-medium">П-Н-П</th>
                      {tournament.topRounds > 0 &&
                        tournament.currentRound > tournament.swissRounds && (
                          <th className="text-left p-2 font-medium">
                            Статус в топе
                          </th>
                        )}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((participant, index) => {
                      if (!participant) return null;
                      const isCurrentPlayer =
                        participant.user.id === currentUserId;

                      return (
                        <tr
                          key={participant.user.id}
                          className={`border-b hover:bg-gray-50 ${
                            isCurrentPlayer ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="p-2">
                            <Badge variant="outline">{index + 1}</Badge>
                          </td>
                          <td
                            className={`p-2 ${isCurrentPlayer ? "font-bold" : "font-medium"}`}
                          >
                            {participant.user.name}
                            {isCurrentPlayer && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Вы
                              </Badge>
                            )}
                          </td>
                          <td
                            className={`p-2 ${isCurrentPlayer ? "font-bold" : ""}`}
                          >
                            {participant.points}
                          </td>
                          <td
                            className={`p-2 ${isCurrentPlayer ? "font-bold" : ""}`}
                          >
                            {participant.buchholz}
                          </td>
                          <td
                            className={`p-2 ${isCurrentPlayer ? "font-bold" : ""}`}
                          >
                            {participant.sumBuchholz}
                          </td>
                          <td
                            className={`p-2 text-sm text-gray-600 ${isCurrentPlayer ? "font-bold" : ""}`}
                          >
                            {participant.wins}-{participant.draws}-
                            {participant.losses}
                          </td>
                          {tournament.topRounds > 0 &&
                            tournament.currentRound >
                              tournament.swissRounds && (
                              <td
                                className={`p-2 text-sm ${isCurrentPlayer ? "font-bold" : ""}`}
                              >
                                <span className="font-medium">
                                  {getTopStatus(
                                    tournament,
                                    participant.user.id,
                                  )}
                                </span>
                              </td>
                            )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rounds Tab */}
        <TabsContent value="rounds">
          <div className="space-y-4">
            {tournament.rounds?.map((round, roundIndex) => (
              <Card key={roundIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {getRoundName(tournament, round.number)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Стол</TableHead>
                        <TableHead>Игрок 1</TableHead>
                        <TableHead className="text-center">Результат</TableHead>
                        <TableHead>Игрок 2</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {round.matches?.map((match, matchIndex) => {
                        const player1 = appState.users.find(
                          (p) => p.id === match.player1Id,
                        );
                        const player2 = match.player2Id
                          ? appState.users.find((p) => p.id === match.player2Id)
                          : null;
                        const isPlayer1Current =
                          match.player1Id === currentUserId;
                        const isPlayer2Current =
                          match.player2Id === currentUserId;
                        const isCurrentPlayerMatch =
                          isPlayer1Current || isPlayer2Current;

                        return (
                          <TableRow
                            key={matchIndex}
                            className={
                              isCurrentPlayerMatch ? "bg-muted/50" : ""
                            }
                          >
                            <TableCell>{matchIndex + 1}</TableCell>
                            <TableCell
                              className={isPlayer1Current ? "font-bold" : ""}
                            >
                              {player1 ? player1.name : "Неизвестный"}
                              {isPlayer1Current && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  Вы
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {!match.result ? (
                                <Badge variant="outline">Не сыграно</Badge>
                              ) : !player2 ? (
                                <Badge variant="secondary">БАЙ</Badge>
                              ) : match.result === "draw" ? (
                                <Badge variant="secondary">Ничья</Badge>
                              ) : (
                                <Badge
                                  variant={
                                    (match.result === "win1" &&
                                      isPlayer1Current) ||
                                    (match.result === "win2" &&
                                      isPlayer2Current)
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {match.result === "win1" ? "1-0" : "0-1"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell
                              className={isPlayer2Current ? "font-bold" : ""}
                            >
                              {player2 ? (
                                <>
                                  {player2.name}
                                  {isPlayer2Current && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      Вы
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground">
                                  БАЙ
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {(!tournament.rounds || tournament.rounds.length === 0) && (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Icon
                    name="Calendar"
                    size={48}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <p>Туры пока не проведены</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};