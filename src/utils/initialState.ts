import { AppState } from "@/types";

export const getInitialState = (): AppState => ({
  users: [],
  currentUser: null,
  currentPage: "rating",
  players: [],
  cities: [{ id: "ryazan", name: "Рязань" }],
  tournamentFormats: [
    { id: "sealed", name: "Силед", coefficient: 1 },
    { id: "draft", name: "Драфт", coefficient: 1 },
    { id: "constructed", name: "Констрактед", coefficient: 1 },
  ],
  tournaments: [],
  showLogin: false,
});