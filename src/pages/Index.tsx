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

type Page = 'tournaments' | 'admin' | 'my-tournaments' | 'players' | 'profile';

interface AppState {
  users: User[];
  currentUser: User | null;
  currentPage: Page;
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
    currentPage: 'tournaments'
  });
  
  // Auth states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showLogin, setShowLogin] = useState(true);
  
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
      setAppState(prev => ({ ...prev, currentUser: user }));
      setShowLogin(false);
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
    setAppState(prev => ({ ...prev, currentUser: null }));
    setShowLogin(true);
  };

  // User management functions
  const createUser = () => {
    if (!appState.currentUser || appState.currentUser.role !== 'admin') return;
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) return;

    const user: User = {
      id: Date.now().toString(),
      ...newUser,
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

  const canViewTournament = () => {
    return appState.currentUser !== null;
  };

  // Header Navigation Component
  const NavigationHeader = () => (
    <div className="flex items-center justify-between mb-8 bg-card p-4 rounded-lg shadow-sm border">
      <div className="flex items-center gap-4">
        <Icon name="Trophy" size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Турнирная система</h1>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Icon name="User" size={16} />
              <span>{appState.currentUser?.name}</span>
              <Badge variant="outline" className="text-xs">
                {appState.currentUser?.role === 'admin' ? 'Админ' : 
                 appState.currentUser?.role === 'judge' ? 'Судья' : 'Игрок'}
              </Badge>
              <Icon name="ChevronDown" size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {appState.currentUser?.role === 'admin' && (
              <DropdownMenuItem onClick={() => navigateTo('admin')}>
                <Icon name="Settings" size={16} className="mr-2" />
                Админка
              </DropdownMenuItem>
            )}
            {(appState.currentUser?.role === 'admin' || appState.currentUser?.role === 'judge') && (
              <DropdownMenuItem onClick={() => navigateTo('tournaments')}>
                <Icon name="Trophy" size={16} className="mr-2" />
                Турниры
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigateTo('my-tournaments')}>
              <Icon name="User" size={16} className="mr-2" />
              Мои турниры
            </DropdownMenuItem>
            {(appState.currentUser?.role === 'admin' || appState.currentUser?.role === 'judge') && (
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
      </div>
    </div>
  );

  // Login screen
  if (showLogin || !appState.currentUser) {
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
            <Button>
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
              Управление игроками
            </div>
            <Button>
              <Icon name="UserPlus" size={16} className="mr-2" />
              Добавить игрока
            </Button>
          </CardTitle>
          <CardDescription>Создание и управление игроками</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Пока нет игроков</p>
            <p className="text-sm mt-2">Добавьте игроков для участия в турнирах</p>
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