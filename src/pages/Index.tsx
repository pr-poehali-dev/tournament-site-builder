import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'judge' | 'player';
  name: string;
  isActive: boolean;
}

interface Player {
  id: string;
  name: string;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  opponents: string[];
  userId?: string;
}

interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  result: 'player1' | 'player2' | 'draw' | null;
  round: number;
  tableNumber: number;
}

interface Tournament {
  name: string;
  swissRounds: number;
  playoffTop: number;
  currentRound: number;
  status: 'setup' | 'swiss' | 'playoffs' | 'finished';
  players: Player[];
  matches: Match[];
  users: User[];
  currentUser: User | null;
}

const Index = () => {
  const [tournament, setTournament] = useState<Tournament>({
    name: '',
    swissRounds: 3,
    playoffTop: 8,
    currentRound: 0,
    status: 'setup',
    players: [],
    matches: [],
    users: [{
      id: 'admin-1',
      username: 'admin',
      password: 'admin',
      role: 'admin',
      name: 'Администратор',
      isActive: true
    }],
    currentUser: null
  });
  
  const [newPlayerName, setNewPlayerName] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [swissRounds, setSwissRounds] = useState('3');
  const [playoffTop, setPlayoffTop] = useState('8');
  const [activeTab, setActiveTab] = useState('rounds');
  const [selectedRound, setSelectedRound] = useState(1);
  
  // Auth states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showLogin, setShowLogin] = useState(true);
  
  // User management states
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'player' as const,
    name: ''
  });

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      score: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      opponents: []
    };
    
    setTournament(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
    
    setNewPlayerName('');
  };

  const removePlayer = (playerId: string) => {
    setTournament(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
  };

  const generateSwissPairings = () => {
    const players = [...tournament.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.wins - a.wins;
    });

    const matches: Match[] = [];
    const paired: Set<string> = new Set();

    for (let i = 0; i < players.length; i++) {
      if (paired.has(players[i].id)) continue;

      for (let j = i + 1; j < players.length; j++) {
        if (paired.has(players[j].id)) continue;
        if (players[i].opponents.includes(players[j].id)) continue;

        matches.push({
          id: Date.now() + Math.random(),
          player1Id: players[i].id,
          player2Id: players[j].id,
          result: null,
          round: tournament.currentRound + 1,
          tableNumber: matches.length + 1
        });

        paired.add(players[i].id);
        paired.add(players[j].id);
        break;
      }
    }

    if (players.length % 2 === 1) {
      const unpaired = players.find(p => !paired.has(p.id));
      if (unpaired) {
        const byeMatch = {
          id: Date.now() + Math.random(),
          player1Id: unpaired.id,
          player2Id: 'bye',
          result: 'player1' as const,
          round: tournament.currentRound + 1,
          tableNumber: matches.length + 1
        };
        matches.push(byeMatch);
        
        // Начисляем 3 очка за бай сразу
        setTournament(prev => ({
          ...prev,
          players: prev.players.map(player => 
            player.id === unpaired.id 
              ? { ...player, score: player.score + 3, wins: player.wins + 1 }
              : player
          )
        }));
      }
    }

    setTournament(prev => ({
      ...prev,
      matches: [...prev.matches, ...matches],
      currentRound: prev.currentRound + 1
    }));
    
    // Автоматически переключаемся на новый тур
    setSelectedRound(tournament.currentRound + 1);
  };

  // Auth functions
  const login = () => {
    const user = tournament.users.find(u => 
      u.username === loginForm.username && 
      u.password === loginForm.password &&
      u.isActive
    );
    
    if (user) {
      setTournament(prev => ({ ...prev, currentUser: user }));
      setShowLogin(false);
      setLoginForm({ username: '', password: '' });
    }
  };

  const logout = () => {
    setTournament(prev => ({ ...prev, currentUser: null }));
    setShowLogin(true);
  };

  // User management functions
  const createUser = () => {
    if (!tournament.currentUser || tournament.currentUser.role !== 'admin') return;
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) return;

    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      isActive: true
    };

    setTournament(prev => ({
      ...prev,
      users: [...prev.users, user]
    }));

    setNewUser({
      username: '',
      password: '',
      role: 'player',
      name: ''
    });
  };

  const toggleUserStatus = (userId: string) => {
    if (!tournament.currentUser || tournament.currentUser.role !== 'admin') return;
    
    setTournament(prev => ({
      ...prev,
      users: prev.users.map(user =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    }));
  };

  const deleteUser = (userId: string) => {
    if (!tournament.currentUser || tournament.currentUser.role !== 'admin') return;
    if (userId === tournament.currentUser.id) return; // Не можем удалить себя
    
    setTournament(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== userId)
    }));
  };

  const canManageTournament = () => {
    return tournament.currentUser && ['admin', 'judge'].includes(tournament.currentUser.role);
  };

  const canViewTournament = () => {
    return tournament.currentUser !== null;
  };

  const startTournament = () => {
    if (tournament.players.length < 2 || !tournamentName.trim()) return;
    
    const rounds = parseInt(swissRounds);
    const topPlayers = parseInt(playoffTop);
    
    if (rounds < 2 || rounds > 6) return;
    if (topPlayers < 2 || topPlayers > 32 || !isPowerOfTwo(topPlayers)) return;
    
    setTournament(prev => ({
      ...prev,
      name: tournamentName,
      swissRounds: rounds,
      playoffTop: topPlayers,
      status: 'swiss'
    }));
    
    generateSwissPairings();
  };

  const isPowerOfTwo = (n: number) => {
    return n > 0 && (n & (n - 1)) === 0;
  };

  const submitResult = (matchId: string, result: 'player1' | 'player2' | 'draw') => {
    setTournament(prev => {
      const match = prev.matches.find(m => m.id === matchId);
      if (!match) return prev;

      const oldResult = match.result;
      
      // Откат старого результата
      let updatedPlayers = prev.players;
      if (oldResult) {
        updatedPlayers = updatedPlayers.map(player => {
          if (player.id === match.player1Id) {
            const oldScore = oldResult === 'player1' ? 3 : oldResult === 'draw' ? 1 : 0;
            return {
              ...player,
              score: player.score - oldScore,
              wins: oldResult === 'player1' ? player.wins - 1 : player.wins,
              losses: oldResult === 'player2' ? player.losses - 1 : player.losses,
              draws: oldResult === 'draw' ? player.draws - 1 : player.draws,
            };
          }
          if (player.id === match.player2Id && match.player2Id !== 'bye') {
            const oldScore = oldResult === 'player2' ? 3 : oldResult === 'draw' ? 1 : 0;
            return {
              ...player,
              score: player.score - oldScore,
              wins: oldResult === 'player2' ? player.wins - 1 : player.wins,
              losses: oldResult === 'player1' ? player.losses - 1 : player.losses,
              draws: oldResult === 'draw' ? player.draws - 1 : player.draws,
            };
          }
          return player;
        });
      }

      // Применение нового результата
      updatedPlayers = updatedPlayers.map(player => {
        if (player.id === match.player1Id) {
          const newScore = result === 'player1' ? 3 : result === 'draw' ? 1 : 0;
          const opponents = !oldResult && match.player2Id !== 'bye' ? [...player.opponents, match.player2Id] : player.opponents;
          return {
            ...player,
            score: player.score + newScore,
            wins: result === 'player1' ? player.wins + 1 : player.wins,
            losses: result === 'player2' ? player.losses + 1 : player.losses,
            draws: result === 'draw' ? player.draws + 1 : player.draws,
            opponents
          };
        }
        if (player.id === match.player2Id && match.player2Id !== 'bye') {
          const newScore = result === 'player2' ? 3 : result === 'draw' ? 1 : 0;
          const opponents = !oldResult ? [...player.opponents, match.player1Id] : player.opponents;
          return {
            ...player,
            score: player.score + newScore,
            wins: result === 'player2' ? player.wins + 1 : player.wins,
            losses: result === 'player1' ? player.losses + 1 : player.losses,
            draws: result === 'draw' ? player.draws + 1 : player.draws,
            opponents
          };
        }
        return player;
      });

      const updatedMatches = prev.matches.map(m => 
        m.id === matchId ? { ...m, result } : m
      );

      return { ...prev, matches: updatedMatches, players: updatedPlayers };
    });
  };

  const generatePlayoffPairings = () => {
    const topPlayers = [...tournament.players]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.wins - a.wins;
      })
      .slice(0, tournament.playoffTop);

    const matches: Match[] = [];
    for (let i = 0; i < topPlayers.length; i += 2) {
      matches.push({
        id: Date.now() + Math.random() + i,
        player1Id: topPlayers[i].id,
        player2Id: topPlayers[i + 1]?.id || 'bye',
        result: topPlayers[i + 1] ? null : 'player1',
        round: tournament.currentRound + 1,
        tableNumber: Math.floor(i / 2) + 1
      });
    }

    setTournament(prev => ({
      ...prev,
      matches: [...prev.matches, ...matches],
      currentRound: prev.currentRound + 1,
      status: 'playoffs'
    }));
  };

  const nextRound = () => {
    const currentMatches = tournament.matches.filter(m => m.round === tournament.currentRound);
    const allMatchesComplete = currentMatches.every(m => m.result !== null);
    
    if (!allMatchesComplete) return;
    
    if (tournament.currentRound < tournament.swissRounds) {
      generateSwissPairings();
    } else if (tournament.status === 'swiss') {
      generatePlayoffPairings();
    } else {
      // Следующий тур плей-офф
      const winners = currentMatches.map(match => {
        if (match.result === 'player1') return match.player1Id;
        if (match.result === 'player2') return match.player2Id;
        return null;
      }).filter(id => id && id !== 'bye');

      if (winners.length <= 1) {
        setTournament(prev => ({ ...prev, status: 'finished' }));
        return;
      }

      const nextMatches: Match[] = [];
      for (let i = 0; i < winners.length; i += 2) {
        const match = {
          id: Date.now() + Math.random() + i,
          player1Id: winners[i]!,
          player2Id: winners[i + 1] || 'bye',
          result: winners[i + 1] ? null : ('player1' as const),
          round: tournament.currentRound + 1,
          tableNumber: Math.floor(i / 2) + 1
        };
        nextMatches.push(match);
        
        // Если бай, начисляем 3 очка
        if (!winners[i + 1]) {
          setTournament(prev => ({
            ...prev,
            players: prev.players.map(player => 
              player.id === winners[i]
                ? { ...player, score: player.score + 3, wins: player.wins + 1 }
                : player
            )
          }));
        }
      }

      setTournament(prev => ({
        ...prev,
        matches: [...prev.matches, ...nextMatches],
        currentRound: prev.currentRound + 1
      }));
    }
  };

  const calculateBuchholz = (player: Player) => {
    let buchholzSum = 0;
    player.opponents.forEach(opponentId => {
      const opponent = tournament.players.find(p => p.id === opponentId);
      if (opponent) {
        buchholzSum += opponent.score;
      }
    });
    return buchholzSum;
  };

  const currentRoundMatches = tournament.matches.filter(m => m.round === tournament.currentRound);
  const selectedRoundMatches = tournament.matches.filter(m => m.round === selectedRound);
  
  const sortedPlayers = [...tournament.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aBuchholz = calculateBuchholz(a);
    const bBuchholz = calculateBuchholz(b);
    if (bBuchholz !== aBuchholz) return bBuchholz - aBuchholz;
    return b.wins - a.wins;
  });
  
  const availableRounds = Array.from(
    new Set(tournament.matches.map(m => m.round))
  ).sort((a, b) => a - b);
  
  const getRoundName = (round: number) => {
    if (tournament.status === 'swiss' || round <= tournament.swissRounds) {
      return `Швейцарка ${round}`;
    } else {
      const playoffRound = round - tournament.swissRounds;
      const totalPlayoffRounds = Math.log2(tournament.playoffTop);
      if (playoffRound === totalPlayoffRounds) return 'Финал';
      if (playoffRound === totalPlayoffRounds - 1) return 'Полуфинал';
      if (playoffRound === totalPlayoffRounds - 2) return 'Четвертьфинал';
      return `1/${Math.pow(2, totalPlayoffRounds - playoffRound)} финала`;
    }
  };

  const getPlayerName = (playerId: string) => {
    if (playerId === 'bye') return 'БАЙ';
    return tournament.players.find(p => p.id === playerId)?.name || 'Неизвестный игрок';
  };

  // Login screen
  if (showLogin || !tournament.currentUser) {
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
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
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

  if (!canViewTournament()) {
    return <div>Нет доступа</div>;
  }

  if (tournament.status === 'setup') {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with logout */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                <Icon name="Trophy" size={40} className="inline mr-3 text-primary" />
                Система турниров
              </h1>
              <p className="text-muted-foreground text-lg">Создайте турнир со швейцарской системой</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <div className="font-medium">{tournament.currentUser.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {tournament.currentUser.role === 'admin' ? 'Администратор' : 
                   tournament.currentUser.role === 'judge' ? 'Судья' : 'Игрок'}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <Icon name="LogOut" size={14} className="mr-1" />
                Выход
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Settings" size={20} className="mr-2" />
                  Настройка турнира
                </CardTitle>
                <CardDescription>Укажите название турнира для начала</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tournament-name">Название турнира</Label>
                  <Input
                    id="tournament-name"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="Введите название турнира"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="swiss-rounds">Швейцарская система</Label>
                    <select 
                      id="swiss-rounds"
                      value={swissRounds}
                      onChange={(e) => setSwissRounds(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="2">2 тура</option>
                      <option value="3">3 тура</option>
                      <option value="4">4 тура</option>
                      <option value="5">5 туров</option>
                      <option value="6">6 туров</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="playoff-top">Плей-офф топ</Label>
                    <select 
                      id="playoff-top"
                      value={playoffTop}
                      onChange={(e) => setPlayoffTop(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="2">Топ-2 (1 тур)</option>
                      <option value="4">Топ-4 (2 тура)</option>
                      <option value="8">Топ-8 (3 тура)</option>
                      <option value="16">Топ-16 (4 тура)</option>
                      <option value="32">Топ-32 (5 туров)</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Формат: {swissRounds} тур{parseInt(swissRounds) > 4 ? 'ов' : parseInt(swissRounds) > 1 ? 'а' : ''} швейцарки + плей-офф среди топ-{playoffTop}</p>
                </div>
              </CardContent>
            </Card>

            {canManageTournament() && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon name="Users" size={20} className="mr-2" />
                    Участники ({tournament.players.length})
                  </CardTitle>
                  <CardDescription>Добавьте участников турнира</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Имя участника"
                      onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                    />
                    <Button onClick={addPlayer} size="sm">
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {tournament.players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                        <span className="font-medium">{player.name}</span>
                        <Button 
                          onClick={() => removePlayer(player.id)}
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Icon name="X" size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {tournament.currentUser?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon name="UserCog" size={20} className="mr-2" />
                    Управление пользователями
                  </CardTitle>
                  <CardDescription>Создание и управление учетными записями</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 p-3 border rounded-lg">
                    <div className="font-medium">Создать пользователя</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Логин"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      />
                      <Input
                        placeholder="Пароль"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Имя"
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      />
                      <Select value={newUser.role} onValueChange={(value: 'admin' | 'judge' | 'player') => setNewUser({...newUser, role: value})}>
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
                    <Button onClick={createUser} size="sm" className="w-full">
                      <Icon name="UserPlus" size={14} className="mr-2" />
                      Создать
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="font-medium">Пользователи системы</div>
                    {tournament.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : user.role === 'judge' ? 'secondary' : 'outline'}
                          >
                            {user.role === 'admin' ? 'Адм' : user.role === 'judge' ? 'Судья' : 'Игрок'}
                          </Badge>
                          <span className={!user.isActive ? 'line-through text-muted-foreground' : ''}>
                            {user.name} ({user.username})
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant={user.isActive ? "outline" : "default"}
                            onClick={() => toggleUserStatus(user.id)}
                            disabled={user.id === tournament.currentUser?.id}
                          >
                            <Icon name={user.isActive ? "Ban" : "Check"} size={14} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                disabled={user.id === tournament.currentUser?.id}
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
            )}
          </div>

          {canManageTournament() && (
            <div className="text-center mt-6">
              <Button 
                onClick={startTournament}
                disabled={
                  tournament.players.length < 2 || 
                  !tournamentName.trim() ||
                  parseInt(swissRounds) < 2 || parseInt(swissRounds) > 6 ||
                  parseInt(playoffTop) < 2 || parseInt(playoffTop) > 32 || !isPowerOfTwo(parseInt(playoffTop))
                }
                size="lg"
                className="px-8"
              >
                <Icon name="Play" size={20} className="mr-2" />
                Начать турнир
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with logout */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">{tournament.name}</h1>
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <Badge variant="outline">
                {tournament.status === 'swiss' 
                  ? `Швейцарка: тур ${tournament.currentRound} из ${tournament.swissRounds}`
                  : `Плей-офф: Топ-${tournament.playoffTop}`
                }
              </Badge>
              <Badge variant={tournament.status === 'swiss' ? 'default' : 'secondary'}>
                {tournament.status === 'swiss' ? 'Швейцарская система' : 'Плей-офф'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-medium">{tournament.currentUser?.name}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {tournament.currentUser?.role === 'admin' ? 'Администратор' : 
                 tournament.currentUser?.role === 'judge' ? 'Судья' : 'Игрок'}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <Icon name="LogOut" size={14} className="mr-1" />
              Выход
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rounds">Туры</TabsTrigger>
            <TabsTrigger value="results">Результаты</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rounds" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Swords" size={20} className="mr-2" />
                  Туры
                </CardTitle>
                {availableRounds.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {availableRounds.map(round => (
                      <Button
                        key={round}
                        variant={selectedRound === round ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRound(round)}
                      >
                        {getRoundName(round)}
                      </Button>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedRoundMatches.length === 0 && selectedRound === tournament.currentRound && tournament.status === 'swiss' && canManageTournament() && (
                  <div className="text-center py-8">
                    <Button onClick={() => generateSwissPairings()}>
                      Создать паринги
                    </Button>
                  </div>
                )}
                
                {selectedRoundMatches.map((match) => (
                  <div key={match.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">Стол {match.tableNumber}</Badge>
                        <span className="font-medium">{getPlayerName(match.player1Id)}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-medium">{getPlayerName(match.player2Id)}</span>
                      </div>
                      {match.result && (
                        <Badge variant="outline">
                          {match.result === 'player1' ? getPlayerName(match.player1Id) : 
                           match.result === 'player2' ? getPlayerName(match.player2Id) : 'Ничья'}
                        </Badge>
                      )}
                    </div>
                    
                    {match.player2Id !== 'bye' && selectedRound === tournament.currentRound && canManageTournament() && (
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          onClick={() => submitResult(match.id, 'player1')}
                          variant={match.result === 'player1' ? 'default' : 'outline'}
                        >
                          Победил {getPlayerName(match.player1Id)}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => submitResult(match.id, 'draw')}
                          variant={match.result === 'draw' ? 'default' : 'outline'}
                        >
                          Ничья
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => submitResult(match.id, 'player2')}
                          variant={match.result === 'player2' ? 'default' : 'outline'}
                        >
                          Победил {getPlayerName(match.player2Id)}
                        </Button>
                      </div>
                    )}
                    
                    {match.player2Id === 'bye' && (
                      <div className="text-center py-2">
                        <Badge variant="secondary">
                          Бай - автоматически 3 очка
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
                
                {selectedRound === tournament.currentRound && currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.result !== null) && canManageTournament() && (
                  <div className="text-center pt-4">
                    {tournament.status === 'swiss' && tournament.currentRound < tournament.swissRounds ? (
                      <Button onClick={nextRound}>
                        <Icon name="ArrowRight" size={16} className="mr-2" />
                        Следующий тур швейцарки
                      </Button>
                    ) : tournament.status === 'swiss' ? (
                      <Button onClick={nextRound}>
                        <Icon name="Trophy" size={16} className="mr-2" />
                        Начать плей-офф топ-{tournament.playoffTop}
                      </Button>
                    ) : tournament.status === 'playoffs' ? (
                      <Button onClick={nextRound}>
                        <Icon name="ArrowRight" size={16} className="mr-2" />
                        Следующий тур плей-офф
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon name="Crown" size={20} className="mr-2" />
                    Рейтинговая таблица
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedPlayers.map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="font-bold text-foreground">{player.score} оч.</span>
                          <span className="text-xs">Бх: {calculateBuchholz(player).toFixed(1)}</span>
                          <span>{player.wins}П</span>
                          <span>{player.losses}П</span>
                          <span>{player.draws}Н</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon name="History" size={20} className="mr-2" />
                    История матчей
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tournament.matches.filter(m => m.result !== null).map((match) => (
                      <div key={match.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" size="sm">Тур {match.round}</Badge>
                          <Badge variant={match.result === 'draw' ? 'secondary' : 'default'} size="sm">
                            {match.result === 'player1' ? getPlayerName(match.player1Id) : 
                             match.result === 'player2' ? getPlayerName(match.player2Id) : 'Ничья'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getPlayerName(match.player1Id)} vs {getPlayerName(match.player2Id)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;