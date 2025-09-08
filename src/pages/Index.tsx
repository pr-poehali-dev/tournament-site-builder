import { useState } from 'react';
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

type Page = 'rating' | 'tournaments' | 'admin' | 'my-tournaments' | 'players' | 'profile';

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
    showLogin: false
  });
  
  // Auth states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // User management states
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'player' as const,
    name: '',
    city: ''
  });
  
  // Profile edit states
  const [profileEdit, setProfileEdit] = useState({
    city: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Navigation functions
  const navigateTo = (page: Page) => {
    setAppState(prev => ({ ...prev, currentPage: page }));
  };

  // Auth functions
  const login = () => {
    const user = appState.users.find(u => 
      u.username === loginForm.username && 
      u.password === loginForm.password &&
      u.isActive
    );
    
    if (user) {
      setAppState(prev => ({ ...prev, currentUser: user, showLogin: false }));
      setLoginForm({ username: '', password: '' });
      setProfileEdit({
        city: user.city || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const logout = () => {
    setAppState(prev => ({ ...prev, currentUser: null, showLogin: false, currentPage: 'rating' }));
  };

  const showLoginForm = () => {
    setAppState(prev => ({ ...prev, showLogin: true }));
  };

  // User management functions
  const createUser = () => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') {
      alert('У вас нет прав для создания пользователей');
      return;
    }
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) {
      alert('Заполните все обязательные поля');
      return;
    }

    // Проверка на уникальность логина
    if (appState.users.some(u => u.username === newUser.username.trim())) {
      alert('Пользователь с таким логином уже существует');
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username.trim(),
      password: newUser.password.trim(),
      name: newUser.name.trim(),
      city: newUser.city?.trim() || undefined,
      role: newUser.role,
      isActive: true
    };

    setAppState(prev => ({
      ...prev,
      users: [...prev.users, user]
    }));

    setNewUser({
      username: '',
      password: '',
      role: 'player',
      name: '',
      city: ''
    });

    alert(`Пользователь ${user.name} успешно создан!`);
  };

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
      users: prev.users.filter(user => user.id !== userId)
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
  const addPlayer = () => {
    if (!appState.currentUser || !['admin', 'judge'].includes(appState.currentUser.role)) {
      alert('У вас нет прав для добавления игроков');
      return;
    }
    if (!newUser.name.trim()) {
      alert('Введите имя игрока');
      return;
    }

    const player: Player = {
      id: Date.now().toString(),
      name: newUser.name.trim(),
      city: newUser.city?.trim() || undefined,
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

    setNewUser(prev => ({
      ...prev,
      name: '',
      city: ''
    }));

    alert(`Игрок ${player.name} успешно добавлен!`);
  };

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
    
    const tournamentName = prompt('Введите название турнира:');
    if (!tournamentName?.trim()) {
      return;
    }

    // Здесь можно добавить логику создания турнира
    alert(`Турнир "${tournamentName}" будет создан в следующей версии!`);
  };

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

  // Login screen
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

  // Rating Page Component  
  const RatingPage = () => (
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
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Имя"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              />
              <Input
                placeholder="Город"
                value={newUser.city}
                onChange={(e) => setNewUser({...newUser, city: e.target.value})}
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
                <Input
                  id="city"
                  value={profileEdit.city}
                  onChange={(e) => setProfileEdit({...profileEdit, city: e.target.value})}
                  placeholder="Введите город"
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Изменить пароль</h4>
                <div>
                  <Label htmlFor="current-password">Текущий пароль</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={profileEdit.currentPassword}
                    onChange={(e) => setProfileEdit({...profileEdit, currentPassword: e.target.value})}
                    placeholder="Введите текущий пароль"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">Новый пароль</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={profileEdit.newPassword}
                    onChange={(e) => setProfileEdit({...profileEdit, newPassword: e.target.value})}
                    placeholder="Введите новый пароль"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={profileEdit.confirmPassword}
                    onChange={(e) => setProfileEdit({...profileEdit, confirmPassword: e.target.value})}
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

  const TournamentsPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon name="Trophy" size={20} className="mr-2" />
              Управление турнирами
            </div>
            <Button onClick={createTournament}>
              <Icon name="Plus" size={16} className="mr-2" />
              Создать турнир
            </Button>
          </CardTitle>
          <CardDescription>Создание и управление турнирами</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Пока нет турниров</p>
            <p className="text-sm mt-2">Создайте первый турнир, чтобы начать</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const MyTournamentsPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="User" size={20} className="mr-2" />
            Мои турниры
          </CardTitle>
          <CardDescription>Турниры, в которых вы участвовали</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Пока нет турниров</p>
            <p className="text-sm mt-2">Здесь будут отображаться ваши турниры</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PlayersPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon name="Users" size={20} className="mr-2" />
              Управление игроками ({appState.players.length})
            </div>
            <Button onClick={addPlayer}>
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
                placeholder="Имя игрока"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({...prev, name: e.target.value}))}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              />
              <Input
                placeholder="Город"
                value={newUser.city}
                onChange={(e) => setNewUser(prev => ({...prev, city: e.target.value}))}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              />
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
  );

  // Main render with navigation
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
      </div>
    </div>
  );
};

export default Index;