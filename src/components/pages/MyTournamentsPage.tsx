import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Icon from "@/components/ui/icon";
import type { AppState, Page, Tournament } from "@/types";
import { canManageTournament } from "@/utils/permissions";

// Helper function to sort players by TOP tournament results (same as in Index.tsx)
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

  const playerA = getTopPerformance(a.participantId);
  const playerB = getTopPerformance(b.participantId);

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
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  // 5. If same points, use tiebreakers
  if (a.tiebreaker1 !== b.tiebreaker1) {
    return b.tiebreaker1 - a.tiebreaker1;
  }

  return b.tiebreaker2 - a.tiebreaker2;
};

interface MyTournamentsPageProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
}

export const MyTournamentsPage: React.FC<MyTournamentsPageProps> = ({
  appState,
  navigateTo,
}) => {
  const currentUserId = appState.currentUser?.id || "";

  // Filter only confirmed tournaments where current user participated
  const myConfirmedTournaments = appState.tournaments.filter(
    (tournament) =>
      tournament.participants.includes(currentUserId) && tournament.confirmed,
  );

  // Function to calculate player's place in tournament
  const getPlayerPlace = (tournament: Tournament, playerId: string): number => {
    if (!tournament.confirmed) return 0;

    // Calculate final scores for all participants
    const participantScores = tournament.participants.map((participantId) => {
      let score = 0;
      let wins = 0;
      let draws = 0;

      // Count points from Swiss rounds only (same system as Index.tsx: 3-1-0)
      tournament.rounds?.forEach((round) => {
        // Only count Swiss rounds for points calculation
        if (round.number <= tournament.swissRounds) {
          const match = round.matches?.find(
            (m) =>
              m.player1Id === participantId || m.player2Id === participantId,
          );

          if (match && match.result) {
            if (!match.player2Id) {
              // Bye - 3 points
              score += 3;
              wins += 1;
            } else {
              const isPlayer1 = match.player1Id === participantId;
              if (match.result === "draw") {
                score += 1;
                draws += 1;
              } else if (
                (match.result === "win1" && isPlayer1) ||
                (match.result === "win2" && !isPlayer1)
              ) {
                score += 3;
                wins += 1;
              }
            }
          }
        }
      });

      return {
        participantId,
        score,
        wins,
        draws,
        // Tiebreakers: wins first, then draws
        tiebreaker1: wins,
        tiebreaker2: draws,
      };
    });

    // Sort by score (descending), then by tiebreakers
    // Special sorting logic for tournaments with TOP rounds
    participantScores.sort((a, b) => {
      if (
        tournament.topRounds > 0 &&
        tournament.currentRound > tournament.swissRounds
      ) {
        return sortByTopResults(a, b, tournament);
      }

      // Standard Swiss system sorting
      if (b.score !== a.score) return b.score - a.score;
      if (b.tiebreaker1 !== a.tiebreaker1) return b.tiebreaker1 - a.tiebreaker1;
      return b.tiebreaker2 - a.tiebreaker2;
    });

    // Find player's position
    const playerIndex = participantScores.findIndex(
      (p) => p.participantId === playerId,
    );
    return playerIndex + 1;
  };

  // Format tournament type
  const formatTournamentType = (tournament: Tournament): string => {
    const swiss = tournament.swissRounds;
    const top = tournament.topRounds;

    if (swiss > 0 && top > 0) {
      return `${swiss} тура(ов) + Топ-${2 ** top}`;
    } else if (swiss > 0) {
      return `${swiss} тура(ов)`;
    }
    return "Обычный турнир";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="Trophy" size={20} className="mr-2" />
            Мои турниры
          </CardTitle>
          <CardDescription>
            Подтверждённые турниры, в которых вы участвовали (
            {myConfirmedTournaments.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myConfirmedTournaments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon
                name="Trophy"
                size={48}
                className="mx-auto mb-4 opacity-50"
              />
              <p>Пока нет завершённых турниров</p>
              <p className="text-sm mt-2">
                Участвуйте в турнирах, чтобы они появились в истории
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название турнира</TableHead>
                  <TableHead>Формат</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Участников</TableHead>
                  <TableHead className="text-center">Место</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myConfirmedTournaments.map((tournament) => {
                  const place = getPlayerPlace(tournament, currentUserId);
                  const placeColor =
                    place === 1
                      ? "text-yellow-600"
                      : place === 2
                        ? "text-gray-500"
                        : place === 3
                          ? "text-orange-600"
                          : "text-muted-foreground";

                  return (
                    <TableRow
                      key={tournament.id}
                      className="cursor-pointer hover:bg-muted/80"
                      onClick={() =>
                        navigateTo({
                          page: "tournament-view",
                          tournamentId: tournament.id,
                        })
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {tournament.name}
                          {tournament.confirmed && (
                            <Badge variant="secondary" className="text-xs">
                              Под
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatTournamentType(tournament)}</TableCell>
                      <TableCell>{tournament.date}</TableCell>
                      <TableCell className="text-center">
                        {tournament.participants.length}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${placeColor}`}>
                          {place === 1
                            ? "🥇 1"
                            : place === 2
                              ? "🥈 2"
                              : place === 3
                                ? "🥉 3"
                                : place}
                          {place <= 3 && place > 0 ? "" : " место"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
