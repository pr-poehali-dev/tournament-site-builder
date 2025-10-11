import React, { useState } from 'react';
import type { AppState, Tournament, Round } from '@/types';
import { TournamentHeader } from '@/components/tournament/TournamentHeader';
import { TournamentRoundsList } from '@/components/tournament/TournamentRoundsList';
import { TournamentControls } from '@/components/tournament/TournamentControls';
import { TournamentStandings } from '@/components/tournament/TournamentStandings';
import { QuickAddPlayer } from '@/components/tournament/QuickAddPlayer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SeatingTable } from '@/components/tournament/SeatingTable';
import { SeatingEditor } from '@/components/tournament/SeatingEditor';

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
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => void;
  createSeatingRound?: (tournamentId: string) => void;
  deleteSeatingRound?: (tournamentId: string) => void;
  updateRoundMatches: (tournamentId: string, roundId: string, matches: any[]) => void;
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
  updateTournament,
  createSeatingRound,
  deleteSeatingRound,
  updateRoundMatches,
}) => {
  const [isEditingSeating, setIsEditingSeating] = useState(false);

  if (!editingTournament) return null;

  const tournament =
    appState.tournaments.find((t) => t.id === editingTournament.id) ||
    editingTournament;

  const seatingRound = tournament.rounds?.find(r => r.number === 0);
  const regularRounds = tournament.rounds?.filter(r => r.number > 0) || [];

  const handleSeatingEdit = () => {
    setIsEditingSeating(true);
  };

  const handleSeatingCancel = () => {
    setIsEditingSeating(false);
  };

  const handleSeatingSave = (tournamentId: string, roundId: string, matches: any[]) => {
    updateRoundMatches(tournamentId, roundId, matches);
    setIsEditingSeating(false);
  };

  const handleSeatingDelete = () => {
    if (!deleteSeatingRound) return;
    
    if (confirm('Вы уверены, что хотите удалить рассадку? Это действие нельзя отменить.')) {
      deleteSeatingRound(tournament.id);
    }
  };

  return (
    <div className="space-y-6">
      <TournamentHeader 
        tournament={tournament} 
        appState={appState}
        updateTournament={updateTournament}
      />

      <QuickAddPlayer
        tournament={tournament}
        appState={appState}
        updateTournament={updateTournament}
      />

      <Tabs defaultValue="rounds" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="seating">Рассадка</TabsTrigger>
          <TabsTrigger value="rounds">Туры</TabsTrigger>
          <TabsTrigger value="standings">Турнирная таблица</TabsTrigger>
        </TabsList>

        <TabsContent value="seating" className="space-y-4">
          {seatingRound ? (
            isEditingSeating ? (
              <SeatingEditor
                round={seatingRound}
                users={appState.users}
                tournament={tournament}
                onSave={handleSeatingSave}
                onCancel={handleSeatingCancel}
              />
            ) : (
              <SeatingTable
                round={seatingRound}
                users={appState.users}
                tournament={tournament}
                onEdit={handleSeatingEdit}
                onDelete={deleteSeatingRound ? handleSeatingDelete : undefined}
              />
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Рассадка ещё не создана. Создайте рассадку через панель управления.
            </div>
          )}
        </TabsContent>

        <TabsContent value="rounds" className="space-y-4">
          <TournamentControls
            tournament={tournament}
            appState={appState}
            setEditingRoundId={setEditingRoundId}
            setTempMatches={setTempMatches}
            setIsEditingPairings={setIsEditingPairings}
            generatePairings={generatePairings}
            addTournamentRound={addTournamentRound}
            deleteLastRound={deleteLastRound}
            finishTournament={finishTournament}
            confirmTournament={confirmTournament}
            createSeatingRound={createSeatingRound}
          />

          {regularRounds.length > 0 ? (
            <TournamentRoundsList
              tournament={{ ...tournament, rounds: regularRounds }}
              appState={appState}
              updateMatchResult={updateMatchResult}
              togglePlayerDrop={togglePlayerDrop}
              updateRoundMatches={updateRoundMatches}
              deleteSeatingRound={deleteSeatingRound}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Туры ещё не созданы. Начните турнир через панель управления.
            </div>
          )}
        </TabsContent>

        <TabsContent value="standings">
          <TournamentStandings 
            tournament={tournament} 
            appState={appState}
            togglePlayerDrop={togglePlayerDrop}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};