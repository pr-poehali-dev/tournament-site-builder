import React, { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import type { AppState, User, Player } from "@/types";

interface UserCreationFormProps {
  appState: AppState;
  addUser: (user: User) => void;
  addPlayer: (player: Player) => void;
}

export const UserCreationForm: React.FC<UserCreationFormProps> = ({
  appState,
  addUser,
  addPlayer,
}) => {
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

    if (localUsernameRef.current) localUsernameRef.current.value = "";
    if (localPasswordRef.current) localPasswordRef.current.value = "";
    if (localNameRef.current) localNameRef.current.value = "";
    setLocalCity("");
    setLocalRole("player");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="UserPlus" size={20} />
          Создать пользователя
        </CardTitle>
        <CardDescription>Создание новых пользователей системы</CardDescription>
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
            <Select
              value={localRole}
              onValueChange={(value: "admin" | "judge" | "player") => setLocalRole(value)}
            >
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
  );
};
