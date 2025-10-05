import { useCallback } from "react";
import type { AppState, Page, Tournament } from "@/types";

interface TournamentForm {
  name: string;
  date: string;
  city: string;
  format: string;
  description: string;
  isRated: boolean;
  swissRounds: number;
  topRounds: number;
  participants: string[];
  judgeId: string;
  tSeating?: boolean;
}

export const useTournamentHandlers = (
  appState: AppState,
  setTournamentForm: React.Dispatch<React.SetStateAction<TournamentForm>>,
  setEditingTournament: React.Dispatch<React.SetStateAction<Tournament | null>>,
  navigateTo: (page: Page) => void,
  loadTournamentWithGames: (tournamentId: string) => void,
) => {
  const startEditTournament = useCallback(
    async (tournament: Tournament) => {
      setEditingTournament(tournament);
      await loadTournamentWithGames(tournament.id);
      navigateTo("tournamentEdit");
    },
    [navigateTo, loadTournamentWithGames],
  );

  const goToCreateTournament = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const userCity = appState.currentUser?.city || "";

    setTournamentForm({
      name: "",
      date: today,
      city: userCity,
      format: "sealed",
      description: "",
      isRated: true,
      swissRounds: 3,
      topRounds: 1,
      participants: [],
      judgeId: "",
    });

    navigateTo("create-tournament");
  }, [navigateTo, appState.currentUser?.city]);

  return {
    startEditTournament,
    goToCreateTournament,
  };
};
