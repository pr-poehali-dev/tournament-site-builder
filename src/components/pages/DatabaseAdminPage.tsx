import React, { useState, useEffect } from "react";
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

// Database user type
interface DBUser {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'judge' | 'player';
  city?: string;
  is_active: boolean;
  created_at: string;
}

// Tournament types
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

const USERS_API_URL = "https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792";
const TOURNAMENTS_API_URL = "https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45";

const CITIES = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
  "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону"
];

// User Management Component
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Form states
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'judge' | 'player'>('player');
  const [newCity, setNewCity] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(USERS_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setUsers(data.users || []);
      setError("");
    } catch (err: any) {
      setError(`Ошибка загрузки пользователей: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      setError("Заполните все обязательные поля");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(USERS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole,
          city: newCity || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      setUsers([data.user, ...users]);
      
      // Clear form
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setNewRole('player');
      setNewCity("");
      setError("");
    } catch (err: any) {
      setError(`Ошибка создания пользователя: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(`${USERS_API_URL}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update user');
      
      const data = await response.json();
      setUsers(users.map(user => user.id === userId ? data.user : user));
    } catch (err: any) {
      setError(`Ошибка обновления пользователя: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${USERS_API_URL}/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      setUsers(users.filter(user => user.id !== userId));
    } catch (err: any) {
      setError(`Ошибка удаления пользователя: ${err.message}`);
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

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="UserPlus" size={20} />
            Создать пользователя
          </CardTitle>
          <CardDescription>
            Создание новых пользователей в базе данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="username">Логин *</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="username"
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="password"
              />
            </div>
            <div>
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Имя игрока"
              />
            </div>
            <div>
              <Label htmlFor="role">Роль</Label>
              <Select value={newRole} onValueChange={(value: 'admin' | 'judge' | 'player') => setNewRole(value)}>
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
            <div>
              <Label htmlFor="city">Город</Label>
              <Select value={newCity} onValueChange={setNewCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не указан</SelectItem>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={createUser} 
                className="w-full" 
                disabled={loading || !newUsername.trim() || !newPassword.trim() || !newName.trim()}
              >
                {loading ? <Icon name="Loader2" size={16} className="mr-2 animate-spin" /> : <Icon name="Plus" size={16} className="mr-2" />}
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
            Пользователи ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пользователи не найдены</p>
              <p className="text-sm">Создайте первого пользователя выше</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Логин</th>
                    <th className="text-left p-2">Имя</th>
                    <th className="text-left p-2">Роль</th>
                    <th className="text-left p-2">Город</th>
                    <th className="text-left p-2">Статус</th>
                    <th className="text-left p-2">Создан</th>
                    <th className="text-left p-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{user.id}</td>
                      <td className="p-2 font-mono">{user.username}</td>
                      <td className="p-2">{user.name}</td>
                      <td className="p-2">
                        <Badge variant={
                          user.role === 'admin' ? 'default' :
                          user.role === 'judge' ? 'secondary' : 'outline'
                        }>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-2">{user.city || "-"}</td>
                      <td className="p-2">
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Активен' : 'Заблокирован'}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            disabled={loading}
                          >
                            {user.is_active ? 'Блок' : 'Разблок'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={loading}>
                                <Icon name="Trash2" size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить пользователя</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Вы уверены, что хотите удалить пользователя "{user.name}" ({user.username})?
                                  Это действие необратимо.
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Icon name="Loader2" size={24} className="animate-spin mr-2" />
          <span>Загрузка...</span>
        </div>
      )}
    </div>
  );
};

// Tournament Management Component
const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<DBPlayer[]>([]);
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
      const response = await fetch(TOURNAMENTS_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTournaments(data.tournaments || []);
      setError("");
    } catch (err: any) {
      setError(`Ошибка загрузки турниров: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async (tournamentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${TOURNAMENTS_API_URL}/${tournamentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSelectedTournament(data.tournament);
      setPlayers(data.players || []);
      setError("");
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
      const response = await fetch(TOURNAMENTS_API_URL, {
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
      const response = await fetch(TOURNAMENTS_API_URL, {
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
            Создать турнир
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
              <div className="flex gap-2 mb-4">
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
                <div>
                  <h5 className="font-medium mb-2">Игроки ({players.length}):</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {players
                      .sort((a, b) => b.points - a.points)
                      .map((player, idx) => (
                        <div key={player.id} className="flex justify-between text-sm p-1 hover:bg-gray-50 rounded">
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

export const DatabaseAdminPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="Database" size={24} className="text-primary" />
        <h1 className="text-3xl font-bold">Админ-панель (БД)</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Icon name="Users" size={16} />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Icon name="Trophy" size={16} />
            Турниры
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="tournaments" className="mt-6">
          <TournamentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};