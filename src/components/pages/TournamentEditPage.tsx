import React from 'react';
import type { AppState, Tournament, Round } from '@/types';
import { TournamentHeader } from '@/components/tournament/TournamentHeader';
import { TournamentRoundsList } from '@/components/tournament/TournamentRoundsList';
import { TournamentControls } from '@/components/tournament/TournamentControls';
import { TournamentStandings } from '@/components/tournament/TournamentStandings';

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

      <TournamentRoundsList
        tournament={tournament}
        appState={appState}
        updateMatchResult={updateMatchResult}
        togglePlayerDrop={togglePlayerDrop}
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
      />

      <TournamentStandings 
        tournament={tournament} 
        appState={appState}
        togglePlayerDrop={togglePlayerDrop}
      />
    </div>
  );
};