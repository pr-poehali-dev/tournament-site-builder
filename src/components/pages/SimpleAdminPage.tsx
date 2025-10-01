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
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";

interface LocalUser {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'judge' | 'player';
  city?: string;
  is_active: boolean;
  created_at: string;
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



export const SimpleAdminPage: React.FC = () => {
  const [users, setUsers] = useState<LocalUser[]>(() => 
    loadFromLocalStorage('admin_users', getDefaultUsers())
  );

  const [error, setError] = useState<string>("");

  // Auto-save to localStorage when data changes
  useEffect(() => {
    saveToLocalStorage('admin_users', users);
  }, [users]);

  // Form states для пользователей
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'judge' | 'player'>('player');
  const [newCity, setNewCity] = useState("none");

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



  const clearAllData = () => {
    setUsers(getDefaultUsers());
    setError("");
    localStorage.removeItem('admin_users');
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
                Вы уверены, что хотите удалить всех пользователей? 
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

      <UserManagement />
    </div>
  );
};