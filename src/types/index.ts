export interface User {
  id: string;
  username: string;
  role: 'admin' | 'judge' | 'player';
  name: string;
  isActive: boolean;
  city?: string;
}

export type Page = 'rating' | 'tournaments' | 'admin' | 'my-tournaments' | 'profile' | 'cities' | 'formats' | 'create-tournament' | 'tournamentEdit' | 'tournament-management' | { page: 'tournament-view'; tournamentId: string };

export interface City {
  id: string;
  name: string;
}

export interface TournamentFormat {
  id: string;
  name: string;
  coefficient: number;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id?: string; // undefined для бая
  result?: 'win1' | 'win2' | 'draw'; // результат матча
  points1: number; // очки игрока 1
  points2: number; // очки игрока 2 (0 для бая)
  tableNumber?: number; // номер стола
}

export interface Round {
  id: string;
  number: number;
  matches: Match[];
  isCompleted: boolean;
}

export interface Tournament {
  id: string;
  dbId?: number; // ID из базы данных
  name: string;
  date: string;
  city: string;
  format: string;
  description: string;
  isRated: boolean;
  swissRounds: number;
  topRounds: number;
  participants: string[];
  status: 'draft' | 'active' | 'completed' | 'confirmed';
  rounds: Round[];
  currentRound: number;
  judgeId?: string; // ID судьи турнира
  hasSeating?: boolean; // Признак необходимости рассадки
  droppedPlayerIds?: string[];
}

export interface Player {
  id: string;
  name: string;
  city?: string;
  rating: number;
  tournaments: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  currentPage: Page;
  players: Player[];
  cities: City[];
  tournamentFormats: TournamentFormat[];
  tournaments: Tournament[];
  showLogin: boolean;
}

export interface UIState {
  currentUser: User | null;
  currentPage: Page;
  showLogin: boolean;
}