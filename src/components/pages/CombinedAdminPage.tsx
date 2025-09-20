import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import type { AppState, User, Player } from "@/types";

interface CombinedAdminPageProps {
  appState: AppState;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  addUser: (user: User) => void;
  addPlayer: (player: Player) => void;
  resetToInitialState?: () => void;
}

// Database types
interface Tournament {
  id: number;
  name: string;
  type: 'top' | 'swiss';
  status: 'setup' | 'active' | 'completed';
  current_round: number;
  max_rounds?: number;
  created_at: string;
}

interface DBPlayer {
  id: number;
  tournament_id: number;
  name: string;
  points: number;
  buchholz: number;
  sum_buchholz: number;
  wins: number;
  draws: number;
  losses: number;
}

interface Game {
  id: number;
  round_number: number;
  result?: string;
  player1_name: string;
  player2_name: string;
  player1_id: number;
  player2_id: number;
}

const TOURNAMENT_API_URL = "https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45";

// User Management Component (from old AdminPage)
const UserManagement: React.FC<{
  appState: AppState;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  addUser: (user: User) => void;
  addPlayer: (player: Player) => void;
  resetToInitialState?: () => void;
}> = ({ appState, toggleUserStatus, deleteUser, addUser, addPlayer, resetToInitialState }) => {
  const localUsernameRef = useRef<HTMLInputElement>(null);
  const localPasswordRef = useRef<HTMLInputElement>(null);
  const localNameRef = useRef<HTMLInputElement>(null);
  const [localCity, setLocalCity] = useState(appState.currentUser?.city || "");
  const [localRole, setLocalRole] = useState<"admin" | "judge" | "player">("player");

  const handleCreateUser = () => {
    if (!appState.currentUser || appState.currentUser.role !== "admin") {
      alert("У вас нет прав для создания пользователей");
      return;
    }

    const username = localUsernameRef.current?.value?.trim() || "";
    const password = localPasswordRef.current?.value?.trim() || "";
    const name = localNameRef.current?.value?.trim() || "";
    const city = localCity?.trim() || undefined;
    const role = localRole;

    if (!username || !password || !name) {
      alert("Заполните все обязательные поля");
      return;
    }

    if (appState.users.some((u) => u.username === username)) {
      alert("Пользователь с таким логином уже существует");
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: username,
      password: password,
      name: name,
      city: city,
      role: role,
      isActive: true,
    };

    let newPlayer: Player | null = null;
    if (user.role === "judge" || user.role === "player") {
      newPlayer = {
        id: user.id,
        name: user.name,
        city: user.city,
        rating: 1200,
        tournaments: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };
    }

    addUser(user);
    if (newPlayer) {
      addPlayer(newPlayer);
    }

    // Clear form
    if (localUsernameRef.current) localUsernameRef.current.value = "";
    if (localPasswordRef.current) localPasswordRef.current.value = "";
    if (localNameRef.current) localNameRef.current.value = "";
    setLocalCity("");
    setLocalRole("player");
  };

  return (
    <div className="space-y-6">
      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="UserPlus" size={20} />
            Создать пользователя
          </CardTitle>
          <CardDescription>
            Создание новых пользователей системы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="username">Логин *</Label>
              <Input
                id="username"
                ref={localUsernameRef}
                placeholder="username"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                ref={localPasswordRef}
                type="password"
                placeholder="password"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                ref={localNameRef}
                placeholder="Имя игрока"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="city">Город</Label>
              <Select value={localCity} onValueChange={setLocalCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  {appState.cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">Роль</Label>
              <Select value={localRole} onValueChange={(value: "admin" | "judge" | "player") => setLocalRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Игрок</SelectItem>
                  <SelectItem value="judge">Судья</SelectItem>
                  <SelectItem value="admin">Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateUser} className="w-full">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Users" size={20} />
            Пользователи ({appState.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Логин</th>
                  <th className="text-left p-2">Имя</th>
                  <th className="text-left p-2">Город</th>
                  <th className="text-left p-2">Роль</th>
                  <th className="text-left p-2">Статус</th>
                  <th className="text-left p-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {appState.users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{user.username}</td>
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.city || "-"}</td>
                    <td className="p-2">
                      <Badge variant={
                        user.role === 'admin' ? 'default' :
                        user.role === 'judge' ? 'secondary' : 'outline'
                      }>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Активен' : 'Заблокирован'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.isActive ? 'Заблокировать' : 'Разблокировать'}
                        </Button>
                        {user.id !== appState.currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Icon name="Trash2" size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить пользователя</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Вы уверены, что хотите удалить пользователя "{user.name}"?
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Debug Functions */}
      {resetToInitialState && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Icon name="AlertTriangle" size={20} />
              Отладка
            </CardTitle>
            <CardDescription>
              Опасные функции для разработки
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Сбросить все данные
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Сброс всех данных</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие удалит ВСЕ данные и вернет систему к начальному состоянию. Действие необратимо!
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={resetToInitialState}>
                    Сбросить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Tournament Management Component (from NewAdminPage)
const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<DBPlayer[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentType, setNewTournamentType] = useState<'top' | 'swiss'>('top');
  const [newPlayerName, setNewPlayerName] = useState("");

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch(TOURNAMENT_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (err: any) {
      setError(`Ошибка загрузки турниров: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async (tournamentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${TOURNAMENT_API_URL}/${tournamentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSelectedTournament(data.tournament);
      setPlayers(data.players || []);
      setGames(data.games || []);
    } catch (err: any) {
      setError(`Ошибка загрузки деталей турнира: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async () => {
    if (!newTournamentName.trim()) {
      setError("Введите название турнира");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(TOURNAMENT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTournamentName,
          type: newTournamentType,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTournaments([data.tournament, ...tournaments]);
      setNewTournamentName("");
      setError("");
    } catch (err: any) {
      setError(`Ошибка создания турнира: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async () => {
    if (!selectedTournament || !newPlayerName.trim()) {
      setError("Выберите турнир и введите имя игрока");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(TOURNAMENT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_player',
          tournament_id: selectedTournament.id,
          name: newPlayerName,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPlayers([...players, data.player]);
      setNewPlayerName("");
      setError("");
    } catch (err: any) {
      setError(`Ошибка добавления игрока: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <Icon name="AlertCircle" size={20} />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Tournament */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Plus" size={20} />
            Создать турнир (БД)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Название турнира</Label>
              <Input
                value={newTournamentName}
                onChange={(e) => setNewTournamentName(e.target.value)}
                placeholder="Введите название..."
              />
            </div>
            <div>
              <Label>Тип</Label>
              <Select value={newTournamentType} onValueChange={(value: 'top' | 'swiss') => setNewTournamentType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">TOP</SelectItem>
                  <SelectItem value="swiss">Swiss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createTournament} disabled={loading}>
              Создать
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tournament List & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Турниры ({tournaments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Турниры не найдены</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tournaments.map((tournament) => (
                  <div 
                    key={tournament.id}
                    className={`border rounded p-3 cursor-pointer transition-colors ${
                      selectedTournament?.id === tournament.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => loadTournamentDetails(tournament.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{tournament.name}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(tournament.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={tournament.type === 'top' ? 'default' : 'secondary'}>
                          {tournament.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{tournament.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTournament && (
          <Card>
            <CardHeader>
              <CardTitle>Добавить игрока</CardTitle>
              <CardDescription>В турнир "{selectedTournament.name}"</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Имя игрока..."
                  className="flex-1"
                />
                <Button onClick={addPlayer} disabled={loading}>
                  Добавить
                </Button>
              </div>
              {players.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Игроки ({players.length}):</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {players
                      .sort((a, b) => b.points - a.points)
                      .map((player, idx) => (
                        <div key={player.id} className="flex justify-between text-sm">
                          <span>{idx + 1}. {player.name}</span>
                          <span>{player.points} очков</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export const CombinedAdminPage: React.FC<CombinedAdminPageProps> = (props) => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="Settings" size={24} className="text-primary" />
        <h1 className="text-3xl font-bold">Админ-панель</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Icon name="Users" size={16} />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Icon name="Trophy" size={16} />
            Турниры (БД)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement {...props} />
        </TabsContent>
        
        <TabsContent value="tournaments" className="mt-6">
          <TournamentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};