import { AppState } from "@/types";

export const getInitialState = (): AppState => ({
  users: [],
  currentUser: null,
  currentPage: "rating",
  players: [],
  cities: [],
  tournamentFormats: [],
  tournaments: [],
  showLogin: false,
});