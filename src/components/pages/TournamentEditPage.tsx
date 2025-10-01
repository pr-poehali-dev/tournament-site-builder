import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { AppState, Tournament, Round } from '@/types';
import { getTopStatus, sortByTopResults, getRoundName } from '@/utils/tournamentHelpers';

interface TournamentEditPageProps {
  appState: AppState;
  editingTournament: Tournament | null;
  setEditingRoundId: (id: string) => void;
  setTempMatches: (matches: any[]) => void;
  setIsEditingPairings: (value: boolean) => void;
  updateMatchResult: (tournamentId: string, roundId: string, matchId: string, result: string) => void;
  togglePlayerDrop: (tournamentId: string, playerId: string) => void;
  generatePairings: (tournamentId: string) => { success: boolean; matches: any[]; error?: string };
  addTournamentRound: (tournamentId: string, round: Round) => void;
  deleteLastRound: (tournamentId: string) => void;
  finishTournament: (tournamentId: string) => void;
  confirmTournament: (tournamentId: string) => void;
}

export const TournamentEditPage: React.FC<TournamentEditPageProps> = ({
  appState,
  editingTournament,
  setEditingRoundId,
  setTempMatches,
  setIsEditingPairings,
  updateMatchResult,
  togglePlayerDrop,
  generatePairings,
  addTournamentRound,
  deleteLastRound,
  finishTournament,
  confirmTournament,
}) => {
  if (!editingTournament) return null;

  const tournament =
    appState.tournaments.find((t) => t.id === editingTournament.id) ||
    editingTournament;

  const totalRounds = tournament.swissRounds + tournament.topRounds;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Trophy" size={20} />
            {tournament.name}
          </CardTitle>
          <CardDescription>
            {tournament.date} • {tournament.city} • {tournament.format}
          </CardDescription>
        </CardHeader>
      </Card>

      {tournament.rounds && tournament.rounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Туры турнира</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tournament.rounds?.map((round) => (
              <div key={round.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Тур {round.number}</h3>
                  <Badge
                    variant={round.isCompleted ? "default" : "secondary"}
                  >
                    {round.isCompleted ? "Завершён" : "В процессе"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {round.matches.map((match) => {
                    const player1 = appState.users.find(
                      (u) => u.id === match.player1Id,
                    );
                    const player2 = match.player2Id
                      ? appState.users.find((u) => u.id === match.player2Id)
                      : null;

                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-4">
                          <div className="font-medium">
                            Стол {match.tableNumber || "БАЙ"}
                          </div>
                          <div className="flex items-center gap-2">
                            <span>
                              {player1?.name || "Неизвестный игрок"}
                            </span>
                            <span className="text-gray-500">vs</span>
                            <span>{player2?.name || "БАЙ"}</span>
                          </div>
                        </div>

                        {match.result ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {match.result === "win1" &&
                                (player1?.name || "Игрок 1")}
                              {match.result === "win2" &&
                                (player2?.name || "Игрок 2")}
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
                                    variant={
                                      match.result === "win1"
                                        ? "default"
                                        : "outline"
                                    }
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
                                    variant={
                                      match.result === "draw"
                                        ? "default"
                                        : "outline"
                                    }
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
                                    variant={
                                      match.result === "win2"
                                        ? "default"
                                        : "outline"
                                    }
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
                          <div className="space-y-2">
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
                            <div className="flex gap-3 items-center text-sm">
                              <div className="flex items-center gap-1">
                                <Checkbox
                                  id={`drop-${match.id}-1`}
                                  checked={
                                    tournament.droppedPlayerIds?.includes(
                                      match.player1Id,
                                    ) || false
                                  }
                                  onCheckedChange={() =>
                                    togglePlayerDrop(
                                      tournament.id,
                                      match.player1Id,
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`drop-${match.id}-1`}
                                  className="text-red-600 cursor-pointer"
                                >
                                  Дроп{" "}
                                  {
                                    appState.players.find(
                                      (p) => p.id === match.player1Id,
                                    )?.username
                                  }
                                </label>
                              </div>
                              {match.player2Id && (
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    id={`drop-${match.id}-2`}
                                    checked={
                                      tournament.droppedPlayerIds?.includes(
                                        match.player2Id,
                                      ) || false
                                    }
                                    onCheckedChange={() =>
                                      togglePlayerDrop(
                                        tournament.id,
                                        match.player2Id,
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`drop-${match.id}-2`}
                                    className="text-red-600 cursor-pointer"
                                  >
                                    Дроп{" "}
                                    {
                                      appState.players.find(
                                        (p) => p.id === match.player2Id,
                                      )?.username
                                    }
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(appState.currentUser?.role === "admin" ||
        appState.currentUser?.role === "judge") && (
        <Card>
          <CardHeader>
            <CardTitle>Управление турниром</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {(() => {
                const canCreateNextRound =
                  tournament.currentRound < totalRounds &&
                  (tournament.status === "active" ||
                    tournament.status === "draft");
                const lastRound =
                  tournament.rounds && tournament.rounds.length > 0
                    ? tournament.rounds[tournament.rounds.length - 1]
                    : null;
                const isLastRoundCompleted =
                  !lastRound ||
                  lastRound.matches?.every(
                    (match) => !match.player2Id || match.result,
                  ) ||
                  false;

                return (
                  canCreateNextRound &&
                  (tournament.rounds?.length === 0 ||
                    !tournament.rounds?.length ||
                    isLastRoundCompleted) && (
                    <Button
                      onClick={() => {
                        const pairings = generatePairings(tournament.id);
                        if (pairings.success) {
                          const newRound: Round = {
                            id: `round-${Date.now()}`,
                            number: tournament.currentRound + 1,
                            matches: pairings.matches,
                            isCompleted: false,
                          };
                          addTournamentRound(tournament.id, newRound);
                        } else {
                          alert(pairings.error);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Icon name="Plus" size={16} />
                      Создать{" "}
                      {getRoundName(tournament, tournament.currentRound + 1)}
                    </Button>
                  )
                );
              })()}

              {tournament.currentRound < totalRounds &&
                (tournament.status === "active" ||
                  tournament.status === "draft") &&
                tournament.rounds &&
                tournament.rounds.length > 0 &&
                !tournament.rounds[
                  tournament.rounds.length - 1
                ].matches?.every(
                  (match) => !match.player2Id || match.result,
                ) && (
                  <div className="text-center text-sm text-muted-foreground bg-muted p-3 rounded">
                    <Icon name="Clock" size={16} className="inline mr-2" />
                    Завершите все матчи текущего тура для создания следующего
                  </div>
                )}

              {tournament.rounds &&
                tournament.rounds.length > 0 &&
                !tournament.rounds[tournament.rounds.length - 1]
                  ?.isCompleted && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log("Button clicked!");
                      const lastRound =
                        tournament.rounds[tournament.rounds.length - 1];
                      console.log("Last round:", lastRound);
                      console.log("Setting states...");
                      setEditingRoundId(lastRound.id);
                      setTempMatches([...lastRound.matches]);
                      setIsEditingPairings(true);
                      console.log(
                        "States set - isEditingPairings should be true",
                      );
                    }}
                    className="flex items-center gap-2"
                  >
                    <Icon name="RefreshCw" size={16} />
                    Изменить пары в рамках тура
                  </Button>
                )}

              {tournament.rounds && tournament.rounds.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Icon name="Trash2" size={16} />
                      Удалить последний тур
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Подтвердите действие
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы уверены, что хотите удалить последний тур? Все
                        результаты тура будут потеряны.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteLastRound(tournament.id)}
                      >
                        Удалить тур
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {tournament.currentRound === totalRounds &&
                tournament.rounds.length > 0 &&
                tournament.rounds[tournament.rounds.length - 1]
                  ?.isCompleted &&
                tournament.status === "active" && (
                  <Button
                    onClick={() => finishTournament(tournament.id)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Icon name="Flag" size={16} />
                    Завершить турнир
                  </Button>
                )}
              
              {appState.currentUser?.role === 'admin' && 
               tournament.status === 'completed' && 
               !tournament.confirmed && (
                <Button
                  onClick={() => confirmTournament(tournament.id)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Icon name="CheckCircle" size={16} />
                  Подтвердить турнир
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                      <th className="text-left p-2 font-medium">
                        Статус в топе
                      </th>
                    )}
                </tr>
              </thead>
              <tbody>
                {tournament.participants
                  .map((participantId) => {
                    const user = appState.users.find(
                      (u) => u.id === participantId,
                    );
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
                            m.player1Id === participantId ||
                            m.player2Id === participantId,
                        );
                        if (match) {
                          if (!match.player2Id) {
                            points += 3;
                            wins += 1;
                          } else if (match.result) {
                            const isPlayer1 =
                              match.player1Id === participantId;
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
                              m.player1Id === opponentId ||
                              m.player2Id === opponentId,
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
                                (opponentMatch.result === "win1" &&
                                  isOpponentPlayer1) ||
                                (opponentMatch.result === "win2" &&
                                  !isOpponentPlayer1)
                              ) {
                                opponentPoints += 3;
                              }
                            }
                          }
                        }
                      });
                      return acc + opponentPoints;
                    }, 0);

                    const sumBuchholz = opponentIds.reduce(
                      (acc, opponentId) => {
                        let opponentBuchholz = 0;

                        const opponentOpponentIds: string[] = [];
                        tournament.rounds?.forEach((round) => {
                          if (round.number <= tournament.swissRounds) {
                            const opponentMatch = round.matches?.find(
                              (m) =>
                                m.player1Id === opponentId ||
                                m.player2Id === opponentId,
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
                                    m.player1Id === oppOppId ||
                                    m.player2Id === oppOppId,
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
                                      (oppOppMatch.result === "win1" &&
                                        isOppOppPlayer1) ||
                                      (oppOppMatch.result === "win2" &&
                                        !isOppOppPlayer1)
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
                      },
                      0,
                    );

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
                      return sortByTopResults(
                        a!,
                        b!,
                        tournament,
                        appState.users,
                      );
                    }

                    if (b!.points !== a!.points) return b!.points - a!.points;
                    if (b!.buchholz !== a!.buchholz)
                      return b!.buchholz - a!.buchholz;
                    return b!.sumBuchholz - a!.sumBuchholz;
                  })
                  .map((participant, index) => (
                    <tr
                      key={participant!.user.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-2">
                        <Badge variant="outline">{index + 1}</Badge>
                      </td>
                      <td className="p-2 font-medium">
                        {participant!.user.name}
                      </td>
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
    </div>
  );
};