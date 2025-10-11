import React from 'react';
import type { AppState, Tournament, Round } from '@/types';
import { TournamentHeader } from '@/components/tournament/TournamentHeader';
import { TournamentRoundsList } from '@/components/tournament/TournamentRoundsList';
import { TournamentControls } from '@/components/tournament/TournamentControls';
import { TournamentStandings } from '@/components/tournament/TournamentStandings';
import { QuickAddPlayer } from '@/components/tournament/QuickAddPlayer';

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
  if (!editingTournament) return null;

  const tournament =
    appState.tournaments.find((t) => t.id === editingTournament.id) ||
    editingTournament;

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

      <TournamentRoundsList
        tournament={tournament}
        appState={appState}
        updateMatchResult={updateMatchResult}
        togglePlayerDrop={togglePlayerDrop}
        updateRoundMatches={updateRoundMatches}
        deleteSeatingRound={deleteSeatingRound}
      />

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

      <TournamentStandings 
        tournament={tournament} 
        appState={appState}
        togglePlayerDrop={togglePlayerDrop}
      />
    </div>
  );
};