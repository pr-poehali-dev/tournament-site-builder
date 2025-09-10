import React, { useRef, useState } from "react";
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
import type { AppState, User, Player } from "@/types";

interface AdminPageProps {
  appState: AppState;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  addUser: (user: User) => void;
  addPlayer: (player: Player) => void;
  resetToInitialState?: () => void;
}

// User Creation Form Component
const UserCreationForm: React.FC<{
  appState: AppState;
  addUser: (user: User) => void;
  addPlayer: (player: Player) => void;
}> = ({ appState, addUser, addPlayer }) => {
  const localUsernameRef = useRef<HTMLInputElement>(null);
  const localPasswordRef = useRef<HTMLInputElement>(null);
  const localNameRef = useRef<HTMLInputElement>(null);

  // Локальное состояние для Select полей - полностью независимое
  const [localCity, setLocalCity] = useState(appState.currentUser?.city || "");
  const [localRole, setLocalRole] = useState<"admin" | "judge" | "player">(
    "player",
  );

  const handleCreateUser = () => {
    if (!appState.currentUser || appState.currentUser.role !== "admin") {
      alert("У вас нет прав для создания пользователей");
      return;
    }

    // Получаем значения из локальных refs и локального состояния
    const username = localUsernameRef.current?.value?.trim() || "";
    const password = localPasswordRef.current?.value?.trim() || "";
    const name = localNameRef.current?.value?.trim() || "";
    const city = localCity?.trim() || undefined;
    const role = localRole;

    if (!username || !password || !name) {
      alert("Заполните все обязательные поля");
      return;
    }

    // Проверка на уникальность логина
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

    // Создаем игрока для судей и игроков автоматически
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

    // Очищаем локальные поля
    if (localUsernameRef.current) localUsernameRef.current.value = "";
    if (localPasswordRef.current) localPasswordRef.current.value = "";
    if (localNameRef.current) localNameRef.current.value = "";

    // Сбрасываем только роль, город сохраняем
    setLocalRole("player");

    const message =
      user.role === "judge" || user.role === "player"
        ? `Пользователь ${user.name} создан! ${user.role === "judge" ? "Судья" : "Игрок"} также автоматически добавлен в список игроков.`
        : `Пользователь ${user.name} успешно создан!`;
    alert(message);
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg">
      <div className="font-medium">Создать пользователя</div>
      <div className="grid grid-cols-2 gap-2">
        <Input ref={localUsernameRef} type="text" placeholder="Логин" />
        <Input ref={localPasswordRef} type="password" placeholder="Пароль" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input ref={localNameRef} type="text" placeholder="Имя" />
        <Select value={localCity} onValueChange={setLocalCity}>
          <SelectTrigger>
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent>
            {appState.cities.map((city) => (
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

export const AdminPage: React.FC<AdminPageProps> = ({
  appState,
  toggleUserStatus,
  deleteUser,
  addUser,
  addPlayer,
  resetToInitialState,
}) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon name="UserCog" size={20} className="mr-2" />
          Управление пользователями
        </CardTitle>
        <CardDescription>
          Создание и управление учетными записями
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <UserCreationForm
          appState={appState}
          addUser={addUser}
          addPlayer={addPlayer}
        />

        <div className="space-y-2 max-h-96 overflow-y-auto">
          <div className="font-medium">
            Пользователи системы ({appState.users.length})
          </div>
          {appState.users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded border"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    user.role === "admin"
                      ? "default"
                      : user.role === "judge"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {user.role === "admin"
                    ? "Адм"
                    : user.role === "judge"
                      ? "Судья"
                      : "Игрок"}
                </Badge>
                <div
                  className={
                    !user.isActive ? "line-through text-muted-foreground" : ""
                  }
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    @{user.username} • {user.city || "Город не указан"}
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
                        Вы уверены что хотите удалить пользователя {user.name}?
                        Это действие нельзя отменить.
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
    
    {/* Debug Section */}
    {resetToInitialState && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="RotateCcw" size={20} className="mr-2" />
            Отладка
          </CardTitle>
          <CardDescription>
            Функции для разработчика
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={resetToInitialState}
            variant="destructive"
            size="sm"
          >
            <Icon name="RotateCcw" size={14} className="mr-2" />
            Сбросить данные
          </Button>
        </CardContent>
      </Card>
    )}
  </div>
);