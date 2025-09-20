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
import BackendApiTest from "@/components/debug/BackendApiTest";

interface LocalUser {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'judge' | 'player';
  city?: string;
  is_active: boolean;
  created_at: string;
}

interface LocalTournament {
  id: number;
  name: string;
  type: 'top' | 'swiss';
  status: 'setup' | 'active' | 'completed';
  created_at: string;
  players: string[];
}

const CITIES = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
  "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону"
];

// Utility functions for localStorage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

const getDefaultUsers = (): LocalUser[] => [
  {
    id: 1,
    username: "admin",
    name: "Администратор",
    role: "admin",
    city: "Москва",
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const getDefaultTournaments = (): LocalTournament[] => [
  {
    id: 1,
    name: "Тестовый турнир",
    type: "top",
    status: "setup",
    created_at: new Date().toISOString(),
    players: []
  }
];

export const SimpleAdminPage: React.FC = () => {
  const [users, setUsers] = useState<LocalUser[]>(() => 
    loadFromLocalStorage('admin_users', getDefaultUsers())
  );

  const [tournaments, setTournaments] = useState<LocalTournament[]>(() => 
    loadFromLocalStorage('admin_tournaments', getDefaultTournaments())
  );

  const [selectedTournament, setSelectedTournament] = useState<LocalTournament | null>(null);
  const [error, setError] = useState<string>("");

  // Auto-save to localStorage when data changes
  useEffect(() => {
    saveToLocalStorage('admin_users', users);
  }, [users]);

  useEffect(() => {
    saveToLocalStorage('admin_tournaments', tournaments);
  }, [tournaments]);

  // Form states для пользователей
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'judge' | 'player'>('player');
  const [newCity, setNewCity] = useState("none");

  // Form states для турниров
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentType, setNewTournamentType] = useState<'top' | 'swiss'>('top');
  const [newPlayerName, setNewPlayerName] = useState("");

  const createUser = async () => {
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      setError("Заполните все обязательные поля");
      return;
    }

    if (users.some(u => u.username === newUsername)) {
      setError("Пользователь с таким логином уже существует локально");
      return;
    }

    try {
      // Сохраняем пользователя в БД через backend API
      const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole,
          city: newCity === "none" ? undefined : newCity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(`Ошибка API: ${errorData.error || 'Failed to create user'}`);
        return;
      }

      const data = await response.json();
      const createdUser = data.user;

      // Добавляем пользователя в локальное состояние с данными из БД
      const newUser: LocalUser = {
        id: createdUser.id,
        username: createdUser.username,
        name: createdUser.name,
        role: createdUser.role,
        city: createdUser.city,
        is_active: createdUser.is_active,
        created_at: createdUser.created_at
      };

      setUsers([newUser, ...users]);
      
      // Clear form
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setNewRole('player');
      setNewCity("none");
      setError("");

      console.log('✅ Пользователь успешно создан в БД:', createdUser);
    } catch (error) {
      console.error('❌ Ошибка создания пользователя:', error);
      
      // Fallback: сохраняем локально как раньше
      const fallbackUser: LocalUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        username: newUsername,
        name: newName,
        role: newRole,
        city: newCity === "none" ? undefined : newCity,
        is_active: true,
        created_at: new Date().toISOString()
      };

      setUsers([fallbackUser, ...users]);
      
      // Clear form
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setNewRole('player');
      setNewCity("none");
      
      setError(`Сетевая ошибка: ${error.message}. Пользователь создан только локально.`);
    }
  };

  const toggleUserStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, is_active: !user.is_active }
        : user
    ));
  };

  const deleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const createTournament = () => {
    if (!newTournamentName.trim()) {
      setError("Введите название турнира");
      return;
    }

    const newTournament: LocalTournament = {
      id: Math.max(...tournaments.map(t => t.id), 0) + 1,
      name: newTournamentName,
      type: newTournamentType,
      status: 'setup',
      created_at: new Date().toISOString(),
      players: []
    };

    setTournaments([newTournament, ...tournaments]);
    setNewTournamentName("");
    setError("");
  };

  const addPlayer = () => {
    if (!selectedTournament || !newPlayerName.trim()) {
      setError("Выберите турнир и введите имя игрока");
      return;
    }

    const updatedTournament = {
      ...selectedTournament,
      players: [...selectedTournament.players, newPlayerName]
    };

    setTournaments(tournaments.map(t => 
      t.id === selectedTournament.id ? updatedTournament : t
    ));
    setSelectedTournament(updatedTournament);
    setNewPlayerName("");
    setError("");
  };

  const UserManagement = () => (
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
            Создание новых пользователей в системе. Данные сохраняются автоматически в браузер.
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
                  <SelectItem value="none">Не указан</SelectItem>
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
                disabled={!newUsername.trim() || !newPassword.trim() || !newName.trim()}
              >
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
            Пользователи ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.is_active ? 'Блок' : 'Разблок'}
                        </Button>
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
        </CardContent>
      </Card>
    </div>
  );

  const TournamentManagement = () => (
    <div className="space-y-6">
      {/* Create Tournament */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Plus" size={20} />
            Создать турнир
          </CardTitle>
          <CardDescription>
            Все турниры и игроки сохраняются в localStorage браузера
          </CardDescription>
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
            <Button onClick={createTournament}>
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
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tournaments.map((tournament) => (
                <div 
                  key={tournament.id}
                  className={`border rounded p-3 cursor-pointer transition-colors ${
                    selectedTournament?.id === tournament.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTournament(tournament)}
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
                <Button onClick={addPlayer}>
                  Добавить
                </Button>
              </div>
              {selectedTournament.players.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Игроки ({selectedTournament.players.length}):</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedTournament.players.map((player, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-1 hover:bg-gray-50 rounded">
                        <span>{idx + 1}. {player}</span>
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

  const clearAllData = () => {
    setUsers(getDefaultUsers());
    setTournaments(getDefaultTournaments());
    setSelectedTournament(null);
    setError("");
    localStorage.removeItem('admin_users');
    localStorage.removeItem('admin_tournaments');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Settings" size={24} className="text-primary" />
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <Badge variant="secondary" className="text-xs">
            <Icon name="Save" size={12} className="mr-1" />
            Автосохранение
          </Badge>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Icon name="RotateCcw" size={16} className="mr-2" />
              Сбросить данные
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Сбросить все данные</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить все пользователей и турниры? 
                Останутся только тестовые данные. Это действие необратимо.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={clearAllData}>
                Сбросить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Icon name="Users" size={16} />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Icon name="Trophy" size={16} />
            Турниры
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Icon name="Bug" size={16} />
            API Тест
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="tournaments" className="mt-6">
          <TournamentManagement />
        </TabsContent>
        
        <TabsContent value="debug" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Database" size={20} />
                  Backend API Testing
                </CardTitle>
                <CardDescription>
                  Тестирование подключения к базе данных PostgreSQL через Cloud Function
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BackendApiTest />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};