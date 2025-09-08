import { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'judge' | 'player';
  name: string;
  isActive: boolean;
  city?: string;
}

type Page = 'rating' | 'tournaments' | 'admin' | 'my-tournaments' | 'players' | 'profile' | 'cities' | 'formats' | 'create-tournament' | 'tournamentEdit';

interface City {
  id: string;
  name: string;
}

interface TournamentFormat {
  id: string;
  name: string;
  coefficient: number;
}

interface Match {
  id: string;
  player1Id: string;
  player2Id?: string; // undefined для бая
  result?: 'win1' | 'win2' | 'draw'; // результат матча
  points1: number; // очки игрока 1
  points2: number; // очки игрока 2 (0 для бая)
}

interface Round {
  id: string;
  number: number;
  matches: Match[];
  isCompleted: boolean;
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  city: string;
  format: string;
  isRated: boolean;
  swissRounds: number;
  topRounds: number;
  participants: string[];
  status: 'draft' | 'active' | 'completed';
  rounds: Round[];
  currentRound: number;
}

interface Player {
  id: string;
  name: string;
  city?: string;
  rating: number;
  tournaments: number;
  wins: number;
  losses: number;
  draws: number;
}

interface AppState {
  users: User[];
  currentUser: User | null;
  currentPage: Page;
  players: Player[];
  cities: City[];
  tournamentFormats: TournamentFormat[];
  tournaments: Tournament[];
  showLogin: boolean;
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>({
    users: [{
      id: 'admin-1',
      username: 'admin',
      password: 'admin',
      role: 'admin',
      name: 'Администратор',
      isActive: true,
      city: 'Москва'
    }],
    currentUser: null,
    currentPage: 'rating',
    players: [
      { id: '1', name: 'Алексей Петров', city: 'Москва', rating: 2150, tournaments: 15, wins: 12, losses: 2, draws: 1 },
      { id: '2', name: 'Мария Сидорова', city: 'СПб', rating: 2080, tournaments: 12, wins: 9, losses: 2, draws: 1 },
      { id: '3', name: 'Игорь Иванов', city: 'Казань', rating: 1950, tournaments: 8, wins: 5, losses: 2, draws: 1 },
      { id: '4', name: 'Екатерина Козлова', city: 'Москва', rating: 1890, tournaments: 10, wins: 6, losses: 3, draws: 1 },
      { id: '5', name: 'Дмитрий Новиков', city: 'Уфа', rating: 1820, tournaments: 6, wins: 3, losses: 2, draws: 1 }
    ],
    cities: [
      { id: 'moscow', name: 'Москва' },
      { id: 'spb', name: 'СПб' },
      { id: 'kazan', name: 'Казань' },
      { id: 'ufa', name: 'Уфа' },
      { id: 'nnovgorod', name: 'Нижний Новгород' },
      { id: 'ekb', name: 'Екатеринбург' }
    ],
    tournamentFormats: [
      { id: 'sealed', name: 'Силед', coefficient: 1 },
      { id: 'draft', name: 'Драфт', coefficient: 1 },
      { id: 'constructed', name: 'Констрактед', coefficient: 1 }
    ],
    tournaments: [],
    showLogin: false
  });
  
  // Auth states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  

  
  // Profile edit states
  const [profileEdit, setProfileEdit] = useState({
    city: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Player management states
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    city: ''
  });

  // Tournament formats management states
  const [editingFormat, setEditingFormat] = useState<{ id: string; name: string; coefficient: number } | null>(null);
  
  // Tournament creation states
  const [newTournament, setNewTournament] = useState({
    name: '',
    date: '',
    city: '',
    format: '',
    isRated: true,
    swissRounds: 3,
    topRounds: 0,
    participants: [] as string[]
  });

  // Cities management states
  const [newCityName, setNewCityName] = useState('');
  const [editingCity, setEditingCity] = useState<{ id: string; name: string } | null>(null);

  // Tournament management states
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Refs for input focus management
  const playerNameInputRef = useRef<HTMLInputElement>(null);
  const cityNameInputRef = useRef<HTMLInputElement>(null);

  const formatNameInputRef = useRef<HTMLInputElement>(null);
  const formatCoefficientInputRef = useRef<HTMLInputElement>(null);



  // Input handlers with useCallback to prevent focus loss
  const handleLoginUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, username: e.target.value }));
  }, []);

  const handleLoginPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, password: e.target.value }));
  }, []);





  const handleNewPlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPlayer(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleNewPlayerCityChange = useCallback((value: string) => {
    setNewPlayer(prev => ({ ...prev, city: value }));
  }, []);

  const handleProfileCityChange = useCallback((value: string) => {
    setProfileEdit(prev => ({ ...prev, city: value }));
  }, []);

  const handleProfileCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileEdit(prev => ({ ...prev, currentPassword: e.target.value }));
  }, []);

  const handleProfileNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileEdit(prev => ({ ...prev, newPassword: e.target.value }));
  }, []);

  const handleProfileConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileEdit(prev => ({ ...prev, confirmPassword: e.target.value }));
  }, []);

  const handleNewCityNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCityName(e.target.value);
  }, []);

  const handleEditCityNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingCity(prev => {
      if (prev) {
        return { ...prev, name: e.target.value };
      }
      return prev;
    });
  }, []);

  // Navigation functions
  const navigateTo = (page: Page) => {
    console.log('Navigation to:', page);
    setAppState(prev => ({ ...prev, currentPage: page }));
  };

  // Auth functions
  const login = () => {
    console.log('Login attempt with:', loginForm);
    console.log('Available users:', appState.users);
    
    const user = appState.users.find(u => 
      u.username === loginForm.username && 
      u.password === loginForm.password &&
      u.isActive
    );
    
    console.log('Found user:', user);
    
    if (user) {
      console.log('Login successful, updating state...');
      setAppState(prev => ({ ...prev, currentUser: user, showLogin: false }));
      setLoginForm({ username: '', password: '' });
      setProfileEdit({
        city: user.city || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      console.log('Login failed - user not found or inactive');
    }
  };

  const logout = () => {
    setAppState(prev => ({ ...prev, currentUser: null, showLogin: false, currentPage: 'rating' }));
  };

  const showLoginForm = () => {
    setAppState(prev => ({ ...prev, showLogin: true }));
  };

  // User management functions

  const toggleUserStatus = (userId: string) => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') return;
    
    setAppState(prev => ({
      ...prev,
      users: prev.users.map(user =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    }));
  };

  const deleteUser = (userId: string) => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') return;
    if (userId === appState.currentUser.id) return; // Не можем удалить себя
    
    setAppState(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== userId),
      // Также удаляем связанного игрока, если он существует
      players: prev.players.filter(player => player.id !== `player-${userId}`)
    }));
  };

  // Profile management functions
  const updateProfile = () => {
    if (!appState.currentUser) return;
    
    // Проверяем текущий пароль если хотим изменить пароль
    if (profileEdit.newPassword && profileEdit.currentPassword !== appState.currentUser.password) {
      return;
    }
    
    // Проверяем совпадение нового пароля
    if (profileEdit.newPassword && profileEdit.newPassword !== profileEdit.confirmPassword) {
      return;
    }

    const updatedUser = {
      ...appState.currentUser,
      city: profileEdit.city,
      ...(profileEdit.newPassword && { password: profileEdit.newPassword })
    };

    setAppState(prev => ({
      ...prev,
      currentUser: updatedUser,
      users: prev.users.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      )
    }));

    // Сброс формы пароля
    setProfileEdit(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  // Player management functions
  const addPlayer = useCallback(() => {
    if (!appState.currentUser || !['admin', 'judge'].includes(appState.currentUser.role)) {
      alert('У вас нет прав для добавления игроков');
      return;
    }
    if (!newPlayer.name.trim()) {
      alert('Введите имя игрока');
      return;
    }

    const player: Player = {
      id: Date.now().toString(),
      name: newPlayer.name.trim(),
      city: newPlayer.city?.trim() || undefined,
      rating: 1200,
      tournaments: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };

    setAppState(prev => ({
      ...prev,
      players: [...prev.players, player]
    }));

    setNewPlayer({
      name: '',
      city: ''
    });

    // Восстанавливаем фокус на поле имени игрока
    setTimeout(() => {
      playerNameInputRef.current?.focus();
    }, 0);
  }, [appState.currentUser, newPlayer.name, newPlayer.city, appState.players]);

  const deletePlayer = (playerId: string) => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') return;
    
    setAppState(prev => ({
      ...prev,
      players: prev.players.filter(player => player.id !== playerId)
    }));
  };

  // Tournament management functions
  const createTournament = () => {
    if (!appState.currentUser || !['admin', 'judge'].includes(appState.currentUser.role)) {
      alert('У вас нет прав для создания турниров');
      return;
    }
    
    navigateTo('create-tournament');
  };

  // Cities management functions
  const addCity = useCallback(() => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') {
      alert('У вас нет прав для добавления городов');
      return;
    }
    
    const inputValue = cityNameInputRef.current?.value?.trim() || '';
    if (!inputValue) {
      alert('Введите название города');
      return;
    }

    // Проверка на уникальность названия
    if (appState.cities.some(city => city.name.toLowerCase() === inputValue.toLowerCase())) {
      alert('Город с таким названием уже существует');
      return;
    }

    const city: City = {
      id: Date.now().toString(),
      name: inputValue
    };

    setAppState(prev => ({
      ...prev,
      cities: [...prev.cities, city]
    }));

    // Очищаем поле через DOM
    if (cityNameInputRef.current) {
      cityNameInputRef.current.value = '';
    }

    // Восстанавливаем фокус на поле названия города
    setTimeout(() => {
      cityNameInputRef.current?.focus();
    }, 0);
  }, [appState.currentUser, newCityName, appState.cities]);

  const deleteCity = (cityId: string) => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') {
      alert('У вас нет прав для удаления городов');
      return;
    }

    const city = appState.cities.find(c => c.id === cityId);
    if (!city) return;

    // Проверяем, используется ли город
    const isUsed = appState.players.some(player => player.city === city.name) ||
                   appState.users.some(user => user.city === city.name);
    
    if (isUsed) {
      alert('Нельзя удалить город, который используется игроками или пользователями');
      return;
    }

    if (confirm(`Удалить город "${city.name}"?`)) {
      setAppState(prev => ({
        ...prev,
        cities: prev.cities.filter(c => c.id !== cityId)
      }));
      alert(`Город ${city.name} удален!`);
    }
  };

  const startEditCity = (city: City) => {
    setEditingCity(city);
  };

  const saveEditCity = useCallback(() => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') return;
    if (!editingCity || !editingCity.name.trim()) return;

    // Проверка на уникальность названия (исключая текущий город)
    if (appState.cities.some(city => 
      city.id !== editingCity.id && 
      city.name.toLowerCase() === editingCity.name.trim().toLowerCase()
    )) {
      alert('Город с таким названием уже существует');
      return;
    }

    const oldName = appState.cities.find(c => c.id === editingCity.id)?.name;

    setAppState(prev => ({
      ...prev,
      cities: prev.cities.map(city =>
        city.id === editingCity.id ? { ...city, name: editingCity.name.trim() } : city
      ),
      // Обновляем название города у всех игроков и пользователей
      players: prev.players.map(player =>
        player.city === oldName ? { ...player, city: editingCity.name.trim() } : player
      ),
      users: prev.users.map(user =>
        user.city === oldName ? { ...user, city: editingCity.name.trim() } : user
      )
    }));

    setEditingCity(null);
    alert(`Город переименован в ${editingCity.name.trim()}!`);
  }, [appState.currentUser, editingCity, appState.cities, appState.players, appState.users]);

  const cancelEditCity = () => {
    setEditingCity(null);
  };

  // Tournament management functions
  const startEditTournament = useCallback((tournament: Tournament) => {
    setEditingTournament(tournament);
    navigateTo('tournamentEdit');
  }, []);

  const generatePairings = useCallback((tournamentId: string) => {
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const participants = [...tournament.participants];
    const matches: Match[] = [];
    
    // Рассчитываем очки каждого игрока
    const playerStats = participants.map(playerId => {
      const totalPoints = tournament.rounds.reduce((total, round) => {
        const playerMatches = round.matches.filter(m => m.player1Id === playerId || m.player2Id === playerId);
        return total + playerMatches.reduce((matchTotal, match) => {
          if (match.player1Id === playerId) return matchTotal + match.points1;
          if (match.player2Id === playerId) return matchTotal + match.points2;
          return matchTotal;
        }, 0);
      }, 0);

      // Создаем список оппонентов из предыдущих туров
      // Для топ-туров (олимпийская система) учитываем только топ-туры, не швейцарку
      const isTopRound = tournament.currentRound >= tournament.swissRounds;
      const previousOpponents = new Set<string>();
      
      tournament.rounds.forEach((round, index) => {
        // Если это топ-тур, учитываем только предыдущие топ-туры
        const shouldConsiderRound = isTopRound 
          ? index >= tournament.swissRounds 
          : true; // Для швейцарки учитываем все предыдущие туры
          
        if (shouldConsiderRound) {
          round.matches.forEach(match => {
            if (match.player1Id === playerId && match.player2Id) {
              previousOpponents.add(match.player2Id);
            } else if (match.player2Id === playerId) {
              previousOpponents.add(match.player1Id);
            }
          });
        }
      });

      return {
        playerId,
        points: totalPoints,
        previousOpponents: Array.from(previousOpponents)
      };
    });

    // Сортируем по очкам (больше очков = выше позиция)
    playerStats.sort((a, b) => b.points - a.points);
    
    const isTopRound = tournament.currentRound >= tournament.swissRounds;
    
    if (isTopRound) {
      // ОЛИМПИЙСКАЯ СИСТЕМА - формируем пары для топ-турнира
      const topRoundNumber = tournament.currentRound - tournament.swissRounds + 1;
      
      if (topRoundNumber === 1) {
        // Первый топ-тур: определяем количество участников олимпийки
        const playersToAdvance = Math.pow(2, tournament.topRounds); // 2^topRounds игроков
        const qualifiedPlayers = playerStats.slice(0, Math.min(playersToAdvance, playerStats.length));
        
        // Формируем пары: 1 vs последний, 2 vs предпоследний и т.д.
        for (let i = 0; i < qualifiedPlayers.length / 2; i++) {
          const player1 = qualifiedPlayers[i];
          const player2 = qualifiedPlayers[qualifiedPlayers.length - 1 - i];
          
          matches.push({
            id: `${tournamentId}-r${tournament.currentRound + 1}-m${i + 1}`,
            player1Id: player1.playerId,
            player2Id: player2.playerId,
            points1: 0,
            points2: 0
          });
        }
      } else {
        // Последующие топ-туры: берем победителей предыдущего тура
        const previousTopRound = tournament.rounds[tournament.rounds.length - 1];
        const winners: string[] = [];
        
        // Находим победителей предыдущего тура
        previousTopRound.matches.forEach(match => {
          if (match.result === 'win1') {
            winners.push(match.player1Id);
          } else if (match.result === 'win2') {
            winners.push(match.player2Id!);
          }
          // Если нет результата - игроки не могут пройти дальше
        });
        
        // Сортируем победителей по общим очкам турнира
        const winnersWithStats = winners.map(playerId => 
          playerStats.find(p => p.playerId === playerId)
        ).filter(Boolean).sort((a, b) => b!.points - a!.points);
        
        // Формируем пары из победителей: лучший vs худший
        for (let i = 0; i < winnersWithStats.length / 2; i++) {
          const player1 = winnersWithStats[i]!;
          const player2 = winnersWithStats[winnersWithStats.length - 1 - i]!;
          
          matches.push({
            id: `${tournamentId}-r${tournament.currentRound + 1}-m${i + 1}`,
            player1Id: player1.playerId,
            player2Id: player2.playerId,
            points1: 0,
            points2: 0
          });
        }
      }
    } else {
      // ШВЕЙЦАРСКАЯ СИСТЕМА
      const availablePlayers = [...playerStats];
      
      // Если нечетное количество игроков, заранее выделяем игрока с наименьшими очками на бай
      let byePlayer = null;
      if (availablePlayers.length % 2 !== 0) {
        const sortedForBye = [...availablePlayers].sort((a, b) => a.points - b.points);
        byePlayer = sortedForBye[0];
        
        const byeIndex = availablePlayers.findIndex(p => p.playerId === byePlayer!.playerId);
        if (byeIndex !== -1) {
          availablePlayers.splice(byeIndex, 1);
        }
      }
      
      // Швейцарский алгоритм парингов
      while (availablePlayers.length > 1) {
        let player1 = availablePlayers.shift()!;
        let player2Index = -1;
        
        // Находим подходящего оппонента (с кем не играл)
        for (let i = 0; i < availablePlayers.length; i++) {
          const potentialOpponent = availablePlayers[i];
          if (!player1.previousOpponents.includes(potentialOpponent.playerId)) {
            player2Index = i;
            break;
          }
        }
        
        // Если не нашли подходящего оппонента, берем первого доступного
        if (player2Index === -1 && availablePlayers.length > 0) {
          player2Index = 0;
        }
        
        if (player2Index !== -1) {
          const player2 = availablePlayers.splice(player2Index, 1)[0];
          matches.push({
            id: `${tournamentId}-r${tournament.currentRound + 1}-m${matches.length + 1}`,
            player1Id: player1.playerId,
            player2Id: player2.playerId,
            points1: 0,
            points2: 0
          });
        }
      }
      
      // Добавляем бай для игрока с наименьшими очками (если был выделен)
      if (byePlayer) {
        matches.push({
          id: `${tournamentId}-r${tournament.currentRound + 1}-bye`,
          player1Id: byePlayer.playerId,
          points1: 3, // 3 очка за бай
          points2: 0
        });
      }
    }

    const newRound: Round = {
      id: `${tournamentId}-r${tournament.currentRound + 1}`,
      number: tournament.currentRound + 1,
      matches,
      isCompleted: false
    };

    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t =>
        t.id === tournamentId
          ? {
              ...t,
              rounds: [...t.rounds, newRound],
              currentRound: t.currentRound + 1,
              status: 'active'
            }
          : t
      )
    }));

    alert(`Сгенерирован тур ${tournament.currentRound + 1}`);
  }, [appState.tournaments]);

  const updateMatchResult = useCallback((tournamentId: string, roundId: string, matchId: string, result: 'win1' | 'win2' | 'draw') => {
    let points1 = 0, points2 = 0;
    
    switch (result) {
      case 'win1':
        points1 = 3;
        points2 = 0;
        break;
      case 'win2':
        points1 = 0;
        points2 = 3;
        break;
      case 'draw':
        points1 = 1;
        points2 = 1;
        break;
    }

    setAppState(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(tournament =>
        tournament.id === tournamentId
          ? {
              ...tournament,
              rounds: tournament.rounds.map(round =>
                round.id === roundId
                  ? {
                      ...round,
                      matches: round.matches.map(match =>
                        match.id === matchId
                          ? { ...match, result, points1, points2 }
                          : match
                      )
                    }
                  : round
              )
            }
          : tournament
      )
    }));
  }, []);

  // Key press handlers (defined after main functions to avoid initialization errors)
  const handlePlayerNameKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  }, [addPlayer]);

  const handleCityNameKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addCity();
    }
  }, [addCity]);

  const handleEditCityKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveEditCity();
    }
  }, [saveEditCity]);

  // Tournament formats management functions
  const addFormat = useCallback(() => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') {
      alert('У вас нет прав для добавления форматов');
      return;
    }
    
    const name = formatNameInputRef.current?.value?.trim() || '';
    const coefficientStr = formatCoefficientInputRef.current?.value?.trim() || '';
    
    if (!name) {
      alert('Введите название формата');
      return;
    }
    
    const coefficient = parseInt(coefficientStr, 10);
    if (!coefficient || coefficient < 1) {
      alert('Введите коэффициент (натуральное число)');
      return;
    }

    // Проверка на уникальность названия
    if (appState.tournamentFormats.some(format => format.name.toLowerCase() === name.toLowerCase())) {
      alert('Формат с таким названием уже существует');
      return;
    }

    const format: TournamentFormat = {
      id: Date.now().toString(),
      name,
      coefficient
    };

    setAppState(prev => ({
      ...prev,
      tournamentFormats: [...prev.tournamentFormats, format]
    }));

    // Очищаем поля через DOM
    if (formatNameInputRef.current) {
      formatNameInputRef.current.value = '';
    }
    if (formatCoefficientInputRef.current) {
      formatCoefficientInputRef.current.value = '';
    }

    alert(`Формат "${name}" добавлен с коэффициентом ${coefficient}!`);
  }, [appState.currentUser, appState.tournamentFormats]);

  const startEditFormat = useCallback((format: TournamentFormat) => {
    setEditingFormat({ ...format });
  }, []);

  const handleEditFormatNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingFormat(prev => {
      if (prev) {
        return { ...prev, name: e.target.value };
      }
      return prev;
    });
  }, []);

  const handleEditFormatCoefficientChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingFormat(prev => {
      if (prev) {
        return { ...prev, coefficient: parseInt(e.target.value) || 1 };
      }
      return prev;
    });
  }, []);

  const saveEditFormat = useCallback(() => {
    if (!editingFormat || !editingFormat.name.trim()) {
      alert('Введите название формата');
      return;
    }
    
    if (editingFormat.coefficient < 1) {
      alert('Коэффициент должен быть натуральным числом');
      return;
    }

    // Проверка на уникальность названия (исключая текущий формат)
    if (appState.tournamentFormats.some(format => 
      format.id !== editingFormat.id && 
      format.name.toLowerCase() === editingFormat.name.trim().toLowerCase()
    )) {
      alert('Формат с таким названием уже существует');
      return;
    }

    setAppState(prev => ({
      ...prev,
      tournamentFormats: prev.tournamentFormats.map(format =>
        format.id === editingFormat.id
          ? { ...format, name: editingFormat.name.trim(), coefficient: editingFormat.coefficient }
          : format
      )
    }));

    setEditingFormat(null);
    alert(`Формат сохранён!`);
  }, [appState.tournamentFormats, editingFormat]);

  const cancelEditFormat = useCallback(() => {
    setEditingFormat(null);
  }, []);

  const deleteFormat = useCallback((formatId: string) => {
    const format = appState.tournamentFormats.find(f => f.id === formatId);
    if (!format) return;

    if (confirm(`Удалить формат "${format.name}"?`)) {
      setAppState(prev => ({
        ...prev,
        tournamentFormats: prev.tournamentFormats.filter(f => f.id !== formatId)
      }));
      alert(`Формат "${format.name}" удалён!`);
    }
  }, [appState.tournamentFormats]);

  // Header Navigation Component
  const NavigationHeader = () => (
    <div className="flex items-center justify-between mb-8 bg-card p-4 rounded-lg shadow-sm border">
      <div className="flex items-center gap-4">
        <Icon name="Trophy" size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Турнирная система</h1>
      </div>
      <div className="flex items-center gap-4">
        {appState.currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Icon name="User" size={16} />
                <span>{appState.currentUser.name}</span>
                <Badge variant="outline" className="text-xs">
                  {appState.currentUser.role === 'admin' ? 'Админ' : 
                   appState.currentUser.role === 'judge' ? 'Судья' : 'Игрок'}
                </Badge>
                <Icon name="ChevronDown" size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigateTo('rating')}>
                <Icon name="Award" size={16} className="mr-2" />
                Рейтинг
              </DropdownMenuItem>
              {appState.currentUser.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigateTo('admin')}>
                  <Icon name="Settings" size={16} className="mr-2" />
                  Админка
                </DropdownMenuItem>
              )}
              {appState.currentUser.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigateTo('cities')}>
                  <Icon name="MapPin" size={16} className="mr-2" />
                  Города
                </DropdownMenuItem>
              )}
              {appState.currentUser.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigateTo('formats')}>
                  <Icon name="Layers" size={16} className="mr-2" />
                  Форматы турниров
                </DropdownMenuItem>
              )}
              {(appState.currentUser.role === 'admin' || appState.currentUser.role === 'judge') && (
                <DropdownMenuItem onClick={() => navigateTo('tournaments')}>
                  <Icon name="Trophy" size={16} className="mr-2" />
                  Турниры
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigateTo('my-tournaments')}>
                <Icon name="User" size={16} className="mr-2" />
                Мои турниры
              </DropdownMenuItem>
              {(appState.currentUser.role === 'admin' || appState.currentUser.role === 'judge') && (
                <DropdownMenuItem onClick={() => navigateTo('players')}>
                  <Icon name="Users" size={16} className="mr-2" />
                  Игроки
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigateTo('profile')}>
                <Icon name="UserCog" size={16} className="mr-2" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <Icon name="LogOut" size={16} className="mr-2" />
                Выход
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={showLoginForm} variant="default">
            <Icon name="LogIn" size={16} className="mr-2" />
            Вход
          </Button>
        )}
      </div>
    </div>
  );

  // Rating Page Component  
  const RatingPage = () => {
    console.log('RatingPage rendering, players count:', appState.players.length);
    console.log('Players data:', appState.players);
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="Award" size={20} className="mr-2" />
              Рейтинг игроков
            </CardTitle>
            <CardDescription>Общий рейтинг всех зарегистрированных игроков</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appState.players
                .sort((a, b) => b.rating - a.rating)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4 rounded border bg-card">
                    <div className="flex items-center gap-4">
                      <Badge variant={index === 0 ? 'default' : index < 3 ? 'secondary' : 'outline'} className="w-8 h-8 flex items-center justify-center rounded-full">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-lg">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.city && `${player.city} • `}
                          {player.tournaments} турниров • 
                          {player.wins}П/{player.losses}Пр/{player.draws}Н
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{player.rating}</div>
                      <div className="text-xs text-muted-foreground">Рейтинг</div>
                    </div>
                  </div>
                ))}
              {appState.players.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Award" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Пока нет игроков в рейтинге</p>
                  <p className="text-sm mt-2">Игроки появятся после участия в турнирах</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Отдельный компонент формы создания пользователя для изоляции от ререндеров
  const UserCreationForm = () => {
    const localUsernameRef = useRef<HTMLInputElement>(null);
    const localPasswordRef = useRef<HTMLInputElement>(null);
    const localNameRef = useRef<HTMLInputElement>(null);
    
    // Локальное состояние для Select полей - полностью независимое
    const [localCity, setLocalCity] = useState(appState.currentUser?.city || '');
    const [localRole, setLocalRole] = useState<'admin' | 'judge' | 'player'>('player');

    const handleCreateUser = () => {
      if (!appState.currentUser || appState.currentUser.role !== 'admin') {
        alert('У вас нет прав для создания пользователей');
        return;
      }

      // Получаем значения из локальных refs и локального состояния
      const username = localUsernameRef.current?.value?.trim() || '';
      const password = localPasswordRef.current?.value?.trim() || '';
      const name = localNameRef.current?.value?.trim() || '';
      const city = localCity?.trim() || undefined;
      const role = localRole;

      if (!username || !password || !name) {
        alert('Заполните все обязательные поля');
        return;
      }

      // Проверка на уникальность логина
      if (appState.users.some(u => u.username === username)) {
        alert('Пользователь с таким логином уже существует');
        return;
      }

      const user: User = {
        id: Date.now().toString(),
        username: username,
        password: password,
        name: name,
        city: city,
        role: role,
        isActive: true
      };

      // Создаем игрока для судей и игроков автоматически
      let newPlayer: Player | null = null;
      if (user.role === 'judge' || user.role === 'player') {
        newPlayer = {
          id: `player-${user.id}`,
          name: user.name,
          city: user.city,
          rating: 1200,
          tournaments: 0,
          wins: 0,
          losses: 0,
          draws: 0
        };
      }

      setAppState(prev => ({
        ...prev,
        users: [...prev.users, user],
        players: newPlayer ? [...prev.players, newPlayer] : prev.players
      }));

      // Очищаем локальные поля
      if (localUsernameRef.current) localUsernameRef.current.value = '';
      if (localPasswordRef.current) localPasswordRef.current.value = '';
      if (localNameRef.current) localNameRef.current.value = '';
      
      // Сбрасываем только роль, город сохраняем
      setLocalRole('player');

      const message = (user.role === 'judge' || user.role === 'player')
        ? `Пользователь ${user.name} создан! ${user.role === 'judge' ? 'Судья' : 'Игрок'} также автоматически добавлен в список игроков.`
        : `Пользователь ${user.name} успешно создан!`;
      alert(message);
    };

    return (
      <div className="space-y-3 p-3 border rounded-lg">
        <div className="font-medium">Создать пользователя</div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            ref={localUsernameRef}
            type="text"
            placeholder="Логин"
          />
          <Input
            ref={localPasswordRef}
            type="password"
            placeholder="Пароль"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input
            ref={localNameRef}
            type="text"
            placeholder="Имя"
          />
          <Select value={localCity} onValueChange={setLocalCity}>
            <SelectTrigger>
              <SelectValue placeholder="Город" />
            </SelectTrigger>
            <SelectContent>
              {appState.cities.map(city => (
                <SelectItem key={city.id} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={localRole} onValueChange={setLocalRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Администратор</SelectItem>
              <SelectItem value="judge">Судья</SelectItem>
              <SelectItem value="player">Игрок</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreateUser} size="sm" className="w-full">
          <Icon name="UserPlus" size={14} className="mr-2" />
          Создать
        </Button>
      </div>
    );
  };

  // Page Components
  const AdminPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="UserCog" size={20} className="mr-2" />
            Управление пользователями
          </CardTitle>
          <CardDescription>Создание и управление учетными записями</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserCreationForm />

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="font-medium">Пользователи системы ({appState.users.length})</div>
            {appState.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={user.role === 'admin' ? 'default' : user.role === 'judge' ? 'secondary' : 'outline'}
                  >
                    {user.role === 'admin' ? 'Адм' : user.role === 'judge' ? 'Судья' : 'Игрок'}
                  </Badge>
                  <div className={!user.isActive ? 'line-through text-muted-foreground' : ''}>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      @{user.username} • {user.city || 'Город не указан'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={user.isActive ? "outline" : "default"}
                    onClick={() => toggleUserStatus(user.id)}
                    disabled={user.id === appState.currentUser?.id}
                  >
                    <Icon name={user.isActive ? "Ban" : "Check"} size={14} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        disabled={user.id === appState.currentUser?.id}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить пользователя</AlertDialogTitle>
                        <AlertDialogDescription>
                          Вы уверены что хотите удалить пользователя {user.name}? Это действие нельзя отменить.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(user.id)}>
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ProfilePage = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="User" size={20} className="mr-2" />
            Профиль пользователя
          </CardTitle>
          <CardDescription>Управление личной информацией и настройками</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Имя пользователя</div>
                <div className="font-medium">@{appState.currentUser?.username}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Полное имя</div>
                <div className="font-medium">{appState.currentUser?.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Роль</div>
                <Badge variant="outline">
                  {appState.currentUser?.role === 'admin' ? 'Администратор' : 
                   appState.currentUser?.role === 'judge' ? 'Судья' : 'Игрок'}
                </Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Статус</div>
                <Badge variant={appState.currentUser?.isActive ? 'default' : 'secondary'}>
                  {appState.currentUser?.isActive ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Редактирование профиля</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="city">Город</Label>
                <Select value={profileEdit.city} onValueChange={handleProfileCityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {appState.cities.map(city => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Изменить пароль</h4>
                <div>
                  <Label htmlFor="current-password">Текущий пароль</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={profileEdit.currentPassword}
                    onChange={handleProfileCurrentPasswordChange}
                    placeholder="Введите текущий пароль"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">Новый пароль</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={profileEdit.newPassword}
                    onChange={handleProfileNewPasswordChange}
                    placeholder="Введите новый пароль"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={profileEdit.confirmPassword}
                    onChange={handleProfileConfirmPasswordChange}
                    placeholder="Повторите новый пароль"
                  />
                </div>
              </div>
              
              <Button onClick={updateProfile} className="w-fit">
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить изменения
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TournamentEditPage = () => {
    // Получаем актуальные данные турнира из appState
    const tournament = editingTournament ? appState.tournaments.find(t => t.id === editingTournament.id) : null;
    
    if (!tournament) {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Icon name="AlertTriangle" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Турнир не найден</p>
              <Button onClick={() => navigateTo('tournaments')} className="mt-4">
                Вернуться к турнирам
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const getPlayerName = (playerId: string) => {
      const player = appState.players.find(p => p.id === playerId);
      return player?.name || 'Неизвестный игрок';
    };

    return (
      <div className="space-y-6">
        {/* Заголовок турнира */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Trophy" size={20} />
                <span>Управление турниром: {tournament.name}</span>
                <Badge variant={tournament.status === 'draft' ? 'outline' : tournament.status === 'active' ? 'default' : 'secondary'}>
                  {tournament.status === 'draft' ? 'Черновик' : tournament.status === 'active' ? 'Активен' : 'Завершён'}
                </Badge>
              </div>
              <Button variant="outline" onClick={() => navigateTo('tournaments')}>
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Назад
              </Button>
            </CardTitle>
            <CardDescription>
              {tournament.date} • {tournament.city} • {tournament.format} • {tournament.participants.length} участников
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Управление турами */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Туры турнира</span>
              {(() => {
                // Можем генерировать новый тур если:
                // 1. Не достигли максимального количества туров
                // 2. Предыдущий тур завершен (для топа) или это швейцарка
                const canGenerateRound = tournament.currentRound < (tournament.swissRounds + tournament.topRounds);
                
                if (!canGenerateRound) return false;
                
                const isNextRoundTop = tournament.currentRound >= tournament.swissRounds;
                if (isNextRoundTop && tournament.rounds.length > 0) {
                  // Для топ-туров проверяем, что предыдущий тур завершен
                  const lastRound = tournament.rounds[tournament.rounds.length - 1];
                  const allMatchesHaveResults = lastRound.matches.every(match => match.result !== undefined);
                  return allMatchesHaveResults;
                }
                
                return true; // Для швейцарки можно всегда генерировать
              })() && (
                <Button onClick={() => generatePairings(tournament.id)}>
                  <Icon name="Users" size={16} className="mr-2" />
                  {tournament.currentRound < tournament.swissRounds 
                    ? `Сгенерировать швейцарский тур ${tournament.currentRound + 1}`
                    : (() => {
                        const topRound = tournament.currentRound - tournament.swissRounds + 1;
                        const remainingTopRounds = tournament.topRounds - topRound + 1;
                        
                        if (remainingTopRounds === 1) return 'Сгенерировать финал';
                        if (remainingTopRounds === 2) return 'Сгенерировать полуфинал';
                        if (remainingTopRounds === 3) return 'Сгенерировать четвертьфинал';
                        
                        const participants = Math.pow(2, remainingTopRounds);
                        return `Сгенерировать топ-${participants}`;
                      })()
                  }
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournament.rounds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Туры не созданы</p>
                <p className="text-sm mt-2">Нажмите кнопку выше для создания первого тура</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tournament.rounds.map(round => (
                  <div key={round.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Icon name="Calendar" size={16} />
                        {(() => {
                          if (round.number <= tournament.swissRounds) {
                            return `Швейцарский тур ${round.number}`;
                          } else {
                            const topRound = round.number - tournament.swissRounds;
                            const remainingTopRounds = tournament.topRounds - topRound + 1;
                            
                            if (remainingTopRounds === 1) return 'Финал';
                            if (remainingTopRounds === 2) return 'Полуфинал';
                            if (remainingTopRounds === 3) return 'Четвертьфинал';
                            
                            const participants = Math.pow(2, remainingTopRounds);
                            return `Топ-${participants}`;
                          }
                        })()}
                      </h3>
                      <Badge variant={round.isCompleted ? 'default' : 'outline'}>
                        {round.isCompleted ? 'Завершён' : 'В процессе'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {round.matches.map(match => (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-background rounded border">
                          <div className="flex items-center gap-4">
                            <div className="font-medium">
                              {getPlayerName(match.player1Id)}
                            </div>
                            <div className="text-muted-foreground">vs</div>
                            <div className="font-medium">
                              {match.player2Id ? getPlayerName(match.player2Id) : 'БАЙ'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              {match.points1} - {match.points2}
                            </div>
                            
                            {match.player2Id ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={match.result === 'win1' ? 'default' : 'outline'}
                                  onClick={() => updateMatchResult(tournament.id, round.id, match.id, 'win1')}
                                >
                                  1-0
                                </Button>
                                <Button
                                  size="sm"
                                  variant={match.result === 'draw' ? 'default' : 'outline'}
                                  onClick={() => updateMatchResult(tournament.id, round.id, match.id, 'draw')}
                                >
                                  0.5-0.5
                                </Button>
                                <Button
                                  size="sm"
                                  variant={match.result === 'win2' ? 'default' : 'outline'}
                                  onClick={() => updateMatchResult(tournament.id, round.id, match.id, 'win2')}
                                >
                                  0-1
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="secondary">БАЙ</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Турнирная таблица */}
        <Card>
          <CardHeader>
            <CardTitle>Турнирная таблица</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tournament.participants
                .map(playerId => {
                  const player = appState.players.find(p => p.id === playerId);
                  const totalPoints = tournament.rounds.reduce((total, round) => {
                    const playerMatches = round.matches.filter(m => m.player1Id === playerId || m.player2Id === playerId);
                    return total + playerMatches.reduce((matchTotal, match) => {
                      if (match.player1Id === playerId) return matchTotal + match.points1;
                      if (match.player2Id === playerId) return matchTotal + match.points2;
                      return matchTotal;
                    }, 0);
                  }, 0);
                  
                  return {
                    name: player?.name || 'Неизвестный игрок',
                    points: totalPoints,
                    playerId
                  };
                })
                .sort((a, b) => b.points - a.points)
                .map((player, index) => (
                  <div key={player.playerId} className="flex items-center justify-between p-3 bg-background rounded border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="font-medium">{player.name}</div>
                    </div>
                    <div className="font-bold">{player.points} очков</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const TournamentsPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon name="Trophy" size={20} className="mr-2" />
              Управление турнирами ({appState.tournaments.length})
            </div>
            <Button onClick={createTournament}>
              <Icon name="Plus" size={16} className="mr-2" />
              Создать турнир
            </Button>
          </CardTitle>
          <CardDescription>Создание и управление турнирами</CardDescription>
        </CardHeader>
        <CardContent>
          {appState.tournaments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет турниров</p>
              <p className="text-sm mt-2">Создайте первый турнир, чтобы начать</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appState.tournaments.map(tournament => (
                <div key={tournament.id} className="flex items-center justify-between p-4 rounded border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Badge variant={tournament.status === 'draft' ? 'outline' : tournament.status === 'active' ? 'default' : 'secondary'}>
                      {tournament.status === 'draft' ? 'Черновик' : tournament.status === 'active' ? 'Активен' : 'Завершён'}
                    </Badge>
                    <div>
                      <div className="font-medium text-lg">{tournament.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Icon name="Calendar" size={14} />
                        <span>{tournament.date}</span>
                        <Icon name="MapPin" size={14} />
                        <span>{tournament.city}</span>
                        <Icon name="Layers" size={14} />
                        <span>{tournament.format}</span>
                        <Icon name="Users" size={14} />
                        <span>{tournament.participants.length} участников</span>
                        {tournament.isRated && (
                          <Badge variant="secondary" className="text-xs">Рейтинговый</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Icon name="Eye" size={14} className="mr-1" />
                      Просмотр
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => startEditTournament(tournament)}>
                      <Icon name="Settings" size={14} className="mr-1" />
                      Управление
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const MyTournamentsPage = () => {
    const myTournaments = appState.tournaments.filter(tournament => 
      tournament.participants.includes(appState.currentUser?.id || '')
    );

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="User" size={20} className="mr-2" />
              Мои турниры
            </CardTitle>
            <CardDescription>Турниры, в которых вы участвовали ({myTournaments.length})</CardDescription>
          </CardHeader>
          <CardContent>
            {myTournaments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет турниров</p>
                <p className="text-sm mt-2">Зарегистрируйтесь в турнире, чтобы он появился здесь</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTournaments.map((tournament) => {
                  const totalRounds = tournament.swissRounds + tournament.topRounds;
                  const completedRounds = tournament.rounds.length;
                  const progress = totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0;
                  
                  return (
                    <div key={tournament.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{tournament.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Icon name="Calendar" size={14} />
                              {tournament.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="Users" size={14} />
                              {tournament.participants.length} игроков
                            </span>
                            <Badge variant={
                              tournament.status === 'active' ? 'default' :
                              tournament.status === 'completed' ? 'secondary' : 'outline'
                            }>
                              {tournament.status === 'active' ? 'Активный' :
                               tournament.status === 'completed' ? 'Завершён' : 'Ожидание'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Прогресс</div>
                          <div className="font-medium">{completedRounds}/{totalRounds} туров</div>
                          <div className="text-xs text-muted-foreground">{progress}%</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        {tournament.description}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          Швейцарка: {tournament.swissRounds} туров • 
                          Топ: {tournament.topRounds} туров
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentView('tournaments')}
                        >
                          Открыть турнир
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const PlayersPage = useCallback(() => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon name="Users" size={20} className="mr-2" />
              Управление игроками ({appState.players.length})
            </div>
            <Button onClick={() => playerNameInputRef.current?.focus()}>
              <Icon name="UserPlus" size={16} className="mr-2" />
              Добавить игрока
            </Button>
          </CardTitle>
          <CardDescription>Создание и управление игроками</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 p-3 border rounded-lg">
            <div className="font-medium">Добавить нового игрока</div>
            <div className="flex gap-2">
              <Input
                ref={playerNameInputRef}
                placeholder="Имя игрока"
                value={newPlayer.name}
                onChange={handleNewPlayerNameChange}
                onKeyPress={handlePlayerNameKeyPress}
              />
              <Select value={newPlayer.city} onValueChange={handleNewPlayerCityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  {appState.cities.map(city => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addPlayer}>
                <Icon name="Plus" size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {appState.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-bold text-primary">{player.rating}</div>
                    <div className="text-xs text-muted-foreground">рейтинг</div>
                  </div>
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {player.city && `${player.city} • `}
                      {player.tournaments} турниров • {player.wins}П/{player.losses}Пр/{player.draws}Н
                    </div>
                  </div>
                </div>
                {appState.currentUser?.role === 'admin' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить игрока</AlertDialogTitle>
                        <AlertDialogDescription>
                          Вы уверены что хотите удалить игрока {player.name}? Это действие нельзя отменить.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePlayer(player.id)}>
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
            {appState.players.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет игроков</p>
                <p className="text-sm mt-2">Добавьте игроков для участия в турнирах</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  ), [appState.players, appState.cities, appState.currentUser, newPlayer, addPlayer, deletePlayer, handleNewPlayerNameChange, handleNewPlayerCityChange, handlePlayerNameKeyPress]);

  const CitiesPage = useCallback(() => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="MapPin" size={20} />
              Управление городами
            </CardTitle>
            <CardDescription>
              Добавляйте и редактируйте города для турнирной системы
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Форма добавления города */}
            <div className="flex gap-2">
              <input
                ref={cityNameInputRef}
                type="text"
                placeholder="Название нового города"
                defaultValue=""
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCity();
                  }
                }}
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button onClick={addCity}>
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить
              </Button>
            </div>

            {/* Список городов */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                Всего городов: {appState.cities.length}
              </div>
              
              {appState.cities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="MapPin" size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Нет городов</p>
                  <p className="text-sm">Добавьте первый город выше</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {appState.cities.map((city) => (
                    <div key={city.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon name="MapPin" size={16} className="text-muted-foreground" />
                        <div>
                          <div className="font-medium">{city.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {appState.players.filter(p => p.city === city.name).length} игроков
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEditCity(city)}>
                          <Icon name="Edit" size={14} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить город</AlertDialogTitle>
                              <AlertDialogDescription>
                                Удалить город "{city.name}"? Это действие необратимо.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCity(city.id)} className="bg-destructive hover:bg-destructive/90">
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Модальное окно редактирования */}
            {editingCity && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Редактирование города</div>
                    <div className="flex gap-2">
                      <Input
                        value={editingCity.name}
                        onChange={handleEditCityNameChange}
                        onKeyPress={handleEditCityKeyPress}
                        placeholder="Название города"
                        className="flex-1"
                      />
                      <Button onClick={saveEditCity}>
                        <Icon name="Check" size={16} className="mr-2" />
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={cancelEditCity}>
                        <Icon name="X" size={16} className="mr-2" />
                        Отмена
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }, [appState.cities, appState.players, editingCity, addCity, startEditCity, deleteCity, handleEditCityNameChange, handleEditCityKeyPress, saveEditCity, cancelEditCity]);

  const FormatsPage = useCallback(() => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Layers" size={20} />
              Форматы турниров
            </CardTitle>
            <CardDescription>
              Управление форматами и их коэффициентами для рейтинговых очков
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Форма добавления формата */}
            <div className="flex gap-2">
              <input
                ref={formatNameInputRef}
                type="text"
                placeholder="Название формата"
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <input
                ref={formatCoefficientInputRef}
                type="number"
                min="1"
                step="1"
                placeholder="Коэффициент"
                className="w-32 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button onClick={addFormat}>
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить
              </Button>
            </div>

            {/* Список форматов */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                Всего форматов: {appState.tournamentFormats.length}
              </div>
              
              {appState.tournamentFormats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Layers" size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Нет форматов</p>
                  <p className="text-sm">Добавьте первый формат выше</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {appState.tournamentFormats.map((format) => (
                    <div key={format.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon name="Layers" size={16} className="text-muted-foreground" />
                        <div>
                          <div className="font-medium">{format.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Коэффициент: <span className="font-medium">{format.coefficient}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEditFormat(format)}>
                          <Icon name="Edit" size={14} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить формат</AlertDialogTitle>
                              <AlertDialogDescription>
                                Удалить формат "{format.name}"? Это действие необратимо.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteFormat(format.id)} className="bg-destructive hover:bg-destructive/90">
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Модальное окно редактирования */}
            {editingFormat && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Редактирование формата</div>
                    <div className="flex gap-2">
                      <Input
                        value={editingFormat.name}
                        onChange={handleEditFormatNameChange}
                        placeholder="Название формата"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={editingFormat.coefficient}
                        onChange={handleEditFormatCoefficientChange}
                        placeholder="Коэффициент"
                        className="w-32"
                      />
                      <Button onClick={saveEditFormat}>
                        <Icon name="Check" size={16} className="mr-2" />
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={cancelEditFormat}>
                        <Icon name="X" size={16} className="mr-2" />
                        Отмена
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }, [appState.tournamentFormats, editingFormat, addFormat, startEditFormat, deleteFormat, handleEditFormatNameChange, handleEditFormatCoefficientChange, saveEditFormat, cancelEditFormat]);

  // Мемоизированные обработчики для создания турнира
  const handleTournamentDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTournament(prev => ({ ...prev, date: e.target.value }));
  }, []);

  const handleTournamentCityChange = useCallback((value: string) => {
    setNewTournament(prev => ({ ...prev, city: value }));
  }, []);

  const handleTournamentFormatChange = useCallback((value: string) => {
    setNewTournament(prev => ({ ...prev, format: value }));
  }, []);

  const handleTournamentIsRatedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTournament(prev => ({ ...prev, isRated: e.target.checked }));
  }, []);

  const handleSwissRoundsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTournament(prev => ({ ...prev, swissRounds: Math.max(1, Math.min(8, parseInt(e.target.value) || 1)) }));
  }, []);

  const handleTopRoundsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTournament(prev => ({ ...prev, topRounds: Math.max(0, parseInt(e.target.value) || 0) }));
  }, []);

  const toggleParticipant = useCallback((playerId: string) => {
    setNewTournament(prev => ({
      ...prev,
      participants: prev.participants.includes(playerId)
        ? prev.participants.filter(id => id !== playerId)
        : [...prev.participants, playerId]
    }));
  }, []);

  const CreateTournamentPage = useCallback(() => {
    const handleTournamentSubmit = () => {
      // Читаем название турнира прямо из DOM
      const nameInput = document.getElementById('tournament-name') as HTMLInputElement;
      const tournamentName = nameInput?.value?.trim() || '';
      
      if (!tournamentName) {
        alert('Введите название турнира');
        return;
      }
      if (!newTournament.date) {
        alert('Выберите дату турнира');
        return;
      }
      if (!newTournament.city) {
        alert('Выберите город');
        return;
      }
      if (!newTournament.format) {
        alert('Выберите формат');
        return;
      }
      if (newTournament.participants.length === 0) {
        alert('Добавьте хотя бы одного участника');
        return;
      }

      const tournament: Tournament = {
        id: Date.now().toString(),
        name: tournamentName,
        date: newTournament.date,
        city: newTournament.city,
        format: newTournament.format,
        isRated: newTournament.isRated,
        swissRounds: newTournament.swissRounds,
        topRounds: newTournament.topRounds,
        participants: [...newTournament.participants],
        status: 'draft',
        rounds: [],
        currentRound: 0
      };

      setAppState(prev => ({
        ...prev,
        tournaments: [...prev.tournaments, tournament]
      }));

      // Сбросить форму
      setNewTournament({
        name: '',
        date: '',
        city: '',
        format: '',
        isRated: true,
        swissRounds: 3,
        topRounds: 0,
        participants: []
      });

      alert(`Турнир "${tournament.name}" создан!`);
      navigateTo('tournaments');
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Plus" size={20} />
              Создание турнира
            </CardTitle>
            <CardDescription>
              Заполните данные для создания нового турнира
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Основные данные турнира */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tournament-name">Название турнира</Label>
                <Input
                  id="tournament-name"
                  placeholder="Введите название турнира"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tournament-date">Дата турнира</Label>
                <Input
                  id="tournament-date"
                  type="date"
                  value={newTournament.date}
                  onChange={handleTournamentDateChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tournament-city">Город</Label>
                <Select value={newTournament.city} onValueChange={handleTournamentCityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {appState.cities.map(city => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tournament-format">Формат</Label>
                <Select value={newTournament.format} onValueChange={handleTournamentFormatChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите формат" />
                  </SelectTrigger>
                  <SelectContent>
                    {appState.tournamentFormats.map(format => (
                      <SelectItem key={format.id} value={format.name}>
                        {format.name} (коэф. {format.coefficient})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Настройки турнира */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-rated"
                  checked={newTournament.isRated}
                  onChange={handleTournamentIsRatedChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="is-rated">Рейтинговый турнир</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="swiss-rounds">Туры швейцарки (1-8)</Label>
                <Input
                  id="swiss-rounds"
                  type="number"
                  min="1"
                  max="8"
                  value={newTournament.swissRounds}
                  onChange={handleSwissRoundsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="top-rounds">Туры топа</Label>
                <Input
                  id="top-rounds"
                  type="number"
                  min="0"
                  value={newTournament.topRounds}
                  onChange={handleTopRoundsChange}
                />
              </div>
            </div>

            {/* Участники */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Участники турнира</Label>
                <div className="text-sm text-muted-foreground">
                  Выбрано: {newTournament.participants.length} из {appState.players.length}
                </div>
              </div>
              
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                {appState.players.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Нет игроков</p>
                    <p className="text-sm mt-2">Добавьте игроков в системе</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {appState.players.map(player => (
                      <div key={player.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-accent/50 transition-colors">
                        <input
                          type="checkbox"
                          id={`player-${player.id}`}
                          checked={newTournament.participants.includes(player.id)}
                          onChange={() => toggleParticipant(player.id)}
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`player-${player.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {player.city} • Рейтинг: {player.rating}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-4">
              <Button onClick={handleTournamentSubmit} className="flex-1">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать турнир
              </Button>
              <Button variant="outline" onClick={() => navigateTo('tournaments')}>
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }, [newTournament, appState.cities, appState.tournamentFormats, appState.players, navigateTo, handleTournamentDateChange, handleTournamentCityChange, handleTournamentFormatChange, handleTournamentIsRatedChange, handleSwissRoundsChange, handleTopRoundsChange, toggleParticipant]);

  // Check if showing login screen
  if (appState.showLogin) {
    return (
      <div className="min-h-screen bg-muted/30 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Icon name="Shield" size={20} className="mr-2" />
              Вход в систему
            </CardTitle>
            <CardDescription className="text-center">
              Войдите для доступа к турнирной системе
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                value={loginForm.username}
                onChange={handleLoginUsernameChange}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginPasswordChange}
                placeholder="admin"
                onKeyPress={(e) => e.key === 'Enter' && login()}
              />
            </div>
            <Button onClick={login} className="w-full">
              <Icon name="LogIn" size={16} className="mr-2" />
              Войти
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Для тестирования: admin / admin
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main render with navigation
  console.log('Main render - currentPage:', appState.currentPage);
  console.log('Main render - currentUser:', appState.currentUser);
  console.log('Main render - showLogin:', appState.showLogin);
  
  if (appState.currentPage === 'cities') {
    console.log('Should render CitiesPage, cities data:', appState.cities);
  }
  
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto">
        <NavigationHeader />
        
        {appState.currentPage === 'rating' && <RatingPage />}
        {appState.currentPage === 'admin' && <AdminPage />}
        {appState.currentPage === 'profile' && <ProfilePage />}
        {appState.currentPage === 'tournaments' && <TournamentsPage />}
        {appState.currentPage === 'my-tournaments' && <MyTournamentsPage />}
        {appState.currentPage === 'players' && <PlayersPage />}
        {appState.currentPage === 'cities' && <CitiesPage />}
        {appState.currentPage === 'formats' && <FormatsPage />}
        {appState.currentPage === 'create-tournament' && <CreateTournamentPage />}
        {appState.currentPage === 'tournamentEdit' && <TournamentEditPage />}
      </div>
    </div>
  );
};

export default Index;