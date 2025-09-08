import { AppState } from '@/types';

export const getInitialState = (): AppState => ({
  users: [
    {
      id: 'admin',
      username: 'admin',
      password: 'admin',
      role: 'admin',
      name: 'Администратор',
      isActive: true,
      city: 'Рязань'
    },
    {
      id: 'user1',
      username: 'user1',
      password: '1234',
      role: 'judge',
      name: 'Дмитрий Бурцев',
      isActive: true,
      city: 'Рязань'
    },
    {
      id: 'user2',
      username: 'user2',
      password: '1234',
      role: 'judge',
      name: 'Илья Читаев',
      isActive: true,
      city: 'Рязань'
    },
    {
      id: 'user3',
      username: 'user3',
      password: '1234',
      role: 'judge',
      name: 'Ефим',
      isActive: true,
      city: 'Рязань'
    },
    {
      id: 'user4',
      username: 'user4',
      password: '1234',
      role: 'player',
      name: 'Ферестан',
      isActive: true,
      city: 'Рязань'
    },
    {
      id: 'user5',
      username: 'user5',
      password: '1234',
      role: 'player',
      name: 'Демьян',
      isActive: true,
      city: 'Рязань'
    },
    {
      id: 'user6',
      username: 'user6',
      password: '1234',
      role: 'player',
      name: 'Герман',
      isActive: true,
      city: 'Рязань'
    },
    {
      id: 'user7',
      username: 'user7',
      password: '1234',
      role: 'player',
      name: 'Настя',
      isActive: true,
      city: 'Рязань'
    },
    {
      id: 'user8',
      username: 'user8',
      password: '1234',
      role: 'player',
      name: 'Миша Спешнев',
      isActive: true,
      city: 'Рязань'
    }
  ],
  currentUser: null,
  currentPage: 'rating',
  players: [
    { id: 'player1', name: 'Дмитрий Бурцев', city: 'Рязань', rating: 2100, tournaments: 12, wins: 10, losses: 1, draws: 1 },
    { id: 'player2', name: 'Илья Читаев', city: 'Рязань', rating: 2050, tournaments: 10, wins: 8, losses: 1, draws: 1 },
    { id: 'player3', name: 'Ефим', city: 'Рязань', rating: 2000, tournaments: 8, wins: 6, losses: 1, draws: 1 },
    { id: 'player4', name: 'Ферестан', city: 'Рязань', rating: 1900, tournaments: 15, wins: 11, losses: 3, draws: 1 },
    { id: 'player5', name: 'Демьян', city: 'Рязань', rating: 1850, tournaments: 12, wins: 8, losses: 3, draws: 1 },
    { id: 'player6', name: 'Герман', city: 'Рязань', rating: 1800, tournaments: 10, wins: 6, losses: 3, draws: 1 },
    { id: 'player7', name: 'Настя', city: 'Рязань', rating: 1750, tournaments: 8, wins: 4, losses: 3, draws: 1 },
    { id: 'player8', name: 'Миша Спешнев', city: 'Рязань', rating: 1700, tournaments: 6, wins: 3, losses: 2, draws: 1 }
  ],
  cities: [
    { id: 'ryazan', name: 'Рязань' }
  ],
  tournamentFormats: [
    { id: 'sealed', name: 'Силед', coefficient: 1 },
    { id: 'draft', name: 'Драфт', coefficient: 1 },
    { id: 'constructed', name: 'Констрактед', coefficient: 1 }
  ],
  tournaments: [
    {
      id: '1',
      name: 'Рязанский турнир Magic: The Gathering',
      date: '2024-12-15',
      city: 'Рязань',
      format: 'Sealed',
      description: 'Турнир по формату Sealed в Рязани',
      isRated: true,
      swissRounds: 4,
      topRounds: 2,
      participants: ['user1', 'user4', 'user5', 'user6'],
      status: 'active' as const,
      rounds: [],
      currentRound: 0
    },
    {
      id: '2', 
      name: 'Зимний Draft',
      date: '2024-01-20',
      city: 'Рязань',
      format: 'Draft',
      description: 'Турнир по драфту среди игроков Рязани',
      isRated: true,
      swissRounds: 3,
      topRounds: 1,
      participants: ['user2', 'user7', 'user8'],
      status: 'completed' as const,
      rounds: [],
      currentRound: 0
    },
    {
      id: '3',
      name: 'Constructed Championship',
      date: '2024-03-10',
      city: 'Рязань', 
      format: 'Constructed',
      description: 'Чемпионат по конструктед формату',
      isRated: true,
      swissRounds: 5,
      topRounds: 3,
      participants: ['user3', 'user4', 'user5', 'user6', 'user7', 'user8'],
      status: 'draft' as const,
      rounds: [],
      currentRound: 0
    }
  ],
  showLogin: false
});