import React, { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { toast } from "@/hooks/use-toast";
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
  const localNameRef = useRef<HTMLInputElement>(null);
  const [localCity, setLocalCity] = useState(appState.currentUser?.city || "");
  const [localRole, setLocalRole] = useState<"admin" | "judge" | "player">("player");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async () => {
    if (!appState.currentUser || appState.currentUser.role !== "admin") {
      toast({
        title: "Ошибка",
        description: "У вас нет прав для создания пользователей",
        variant: "destructive"
      });
      return;
    }

    const name = localNameRef.current?.value?.trim() || "";
    const city = localCity?.trim() || undefined;
    const role = localRole;

    if (!name) {
      toast({
        title: "Ошибка",
        description: "Заполните имя пользователя",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    const user: User = {
      id: Date.now().toString(),
      username: "",
      name: name,
      city: city,
      role: role,
      isActive: true,
    };

    const result = await addUser(user);
    setIsCreating(false);

    if (result.success && result.user) {
      // Создаём профиль игрока если нужно
      if (result.user.role === "judge" || result.user.role === "player") {
        const newPlayer: Player = {
          id: result.user.id,
          name: result.user.name,
          city: result.user.city,
          rating: 1200,
          tournaments: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        };
        addPlayer(newPlayer);
      }

      // Показываем сгенерированные данные
      toast({
        title: "Пользователь создан!",
        description: (
          <div className="mt-2 space-y-1">
            <div><strong>Логин:</strong> {result.user.username}</div>
            <div><strong>Временный пароль:</strong> {result.temporaryPassword}</div>
            <div className="text-xs text-muted-foreground mt-2">Передайте эти данные пользователю</div>
          </div>
        ),
        duration: 10000, // 10 секунд
      });

      // Очищаем форму
      if (localNameRef.current) localNameRef.current.value = "";
      setLocalCity("");
      setLocalRole("player");
    } else {
      toast({
        title: "Ошибка",
        description: result.error || "Не удалось создать пользователя",
        variant: "destructive"
      });
    }
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
                  <SelectItem key={city.id} value={city.name}>
                    {city.name}
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
            <Button onClick={handleCreateUser} className="w-full" disabled={isCreating}>
              <Icon name="Plus" size={16} className="mr-2" />
              {isCreating ? "Создаём..." : "Создать"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};