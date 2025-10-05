import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { getRoundName } from '@/utils/tournamentHelpers';

interface TournamentControlsProps {
  tournament: Tournament;
  appState: AppState;
  setEditingRoundId: (id: string) => void;
  setTempMatches: (matches: any[]) => void;
  setIsEditingPairings: (value: boolean) => void;
  generatePairings: (tournamentId: string) => { success: boolean; matches: any[]; error?: string };
  addTournamentRound: (tournamentId: string, round: Round) => void;
  deleteLastRound: (tournamentId: string) => void;
  finishTournament: (tournamentId: string) => void;
  confirmTournament: (tournamentId: string) => void;
  createSeatingRound?: (tournamentId: string) => void;
}

export const TournamentControls: React.FC<TournamentControlsProps> = ({
  tournament,
  appState,
  setEditingRoundId,
  setTempMatches,
  setIsEditingPairings,
  generatePairings,
  addTournamentRound,
  deleteLastRound,
  finishTournament,
  confirmTournament,
  createSeatingRound,
}) => {
  if (
    appState.currentUser?.role !== "admin" &&
    appState.currentUser?.role !== "judge"
  ) {
    return null;
  }

  const totalRounds = tournament.swissRounds + tournament.topRounds;
  const canCreateNextRound =
    tournament.currentRound < totalRounds &&
    (tournament.status === "active" || tournament.status === "draft");
  const lastRound =
    tournament.rounds && tournament.rounds.length > 0
      ? tournament.rounds[tournament.rounds.length - 1]
      : null;
  const isLastRoundCompleted =
    !lastRound ||
    lastRound.matches?.every((match) => !match.player2Id || match.result) ||
    false;

  // Проверка: есть ли только рассадочный тур (number === 0) или нет туров вообще
  const hasOnlySeatingRound = tournament.rounds?.length === 1 && tournament.rounds[0].number === 0;
  const hasNoRounds = !tournament.rounds || tournament.rounds.length === 0;
  const canCreateSeating = tournament.hasSeating && tournament.currentRound === 0 && (hasNoRounds || hasOnlySeatingRound);
  
  // Проверка: есть ли реальные (не рассадочные) туры
  const realRounds = tournament.rounds?.filter(r => r.number > 0) || [];
  const hasNoRealRounds = realRounds.length === 0;

  console.log('🔍 TournamentControls debug:', {
    hasSeating: tournament.hasSeating,
    currentRound: tournament.currentRound,
    roundsLength: tournament.rounds?.length,
    hasOnlySeatingRound,
    hasNoRounds,
    canCreateSeating,
    realRoundsLength: realRounds.length,
    createSeatingRound: !!createSeatingRound
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление турниром</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {canCreateSeating && createSeatingRound && (
            <Button
              onClick={() => createSeatingRound(tournament.id)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Icon name="Users" size={16} />
              Рассадить игроков
            </Button>
          )}

          {canCreateNextRound &&
            (hasNoRealRounds || isLastRoundCompleted) && (
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
                Создать {getRoundName(tournament, tournament.currentRound + 1)}
              </Button>
            )}

          {tournament.currentRound < totalRounds &&
            (tournament.status === "active" || tournament.status === "draft") &&
            realRounds.length > 0 &&
            !realRounds[realRounds.length - 1].matches?.every(
              (match) => !match.player2Id || match.result,
            ) && (
              <div className="text-center text-sm text-muted-foreground bg-muted p-3 rounded">
                <Icon name="Clock" size={16} className="inline mr-2" />
                Завершите все матчи текущего тура для создания следующего
              </div>
            )}

          {realRounds.length > 0 &&
            !realRounds[realRounds.length - 1]?.isCompleted &&
            !tournament.confirmed && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Button clicked!");
                  const lastRound = realRounds[realRounds.length - 1];
                  console.log("Last round:", lastRound);
                  console.log("Setting states...");
                  setEditingRoundId(lastRound.id);
                  setTempMatches([...lastRound.matches]);
                  setIsEditingPairings(true);
                  console.log("States set - isEditingPairings should be true");
                }}
                className="flex items-center gap-2"
              >
                <Icon name="RefreshCw" size={16} />
                Изменить пары в рамках тура
              </Button>
            )}

          {realRounds.length > 0 && 
           !tournament.confirmed && 
           tournament.status !== 'confirmed' && (
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
                  <AlertDialogTitle>Подтвердите действие</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите удалить последний тур? Все результаты
                    тура будут потеряны.
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
            realRounds.length > 0 &&
            realRounds[realRounds.length - 1]?.isCompleted &&
            tournament.status === "active" && (
              <Button
                onClick={() => finishTournament(tournament.id)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Icon name="Flag" size={16} />
                Завершить турнир
              </Button>
            )}

          {appState.currentUser?.role === "admin" &&
            tournament.status === "completed" && (
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
  );
};