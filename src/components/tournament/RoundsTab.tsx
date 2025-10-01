import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import type { AppState, Tournament } from "@/types";
import { getRoundName } from "@/utils/tournamentHelpers";

interface RoundsTabProps {
  tournament: Tournament;
  appState: AppState;
  currentUserId: string;
}

export const RoundsTab: React.FC<RoundsTabProps> = ({
  tournament,
  appState,
  currentUserId,
}) => {
  return (
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
                  const isPlayer1Current = match.player1Id === currentUserId;
                  const isPlayer2Current = match.player2Id === currentUserId;
                  const isCurrentPlayerMatch =
                    isPlayer1Current || isPlayer2Current;

                  return (
                    <TableRow
                      key={matchIndex}
                      className={isCurrentPlayerMatch ? "bg-muted/50" : ""}
                    >
                      <TableCell>{matchIndex + 1}</TableCell>
                      <TableCell
                        className={isPlayer1Current ? "font-bold" : ""}
                      >
                        {player1 ? player1.name : "Неизвестный"}
                        {isPlayer1Current && (
                          <Badge variant="outline" className="ml-2 text-xs">
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
                              (match.result === "win1" && isPlayer1Current) ||
                              (match.result === "win2" && isPlayer2Current)
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
                          <span className="text-muted-foreground">БАЙ</span>
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
            <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Туры пока не проведены</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
