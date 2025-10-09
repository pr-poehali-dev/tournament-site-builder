import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import type { AppState } from "@/types";

interface UsersListProps {
  appState: AppState;
  toggleUserStatus: (userId: string) => void;
  updateUserRole: (userId: string, newRole: 'player' | 'judge' | 'admin') => void;
  deleteUser: (userId: string) => void;
}

export const UsersList: React.FC<UsersListProps> = ({
  appState,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  // Для судей по умолчанию фильтр по их городу, для админов - все города
  const defaultCity = appState.currentUser?.role === "judge" && appState.currentUser?.city 
    ? appState.currentUser.city 
    : "all";
  const [selectedCity, setSelectedCity] = useState<string>(defaultCity);

  const userHasTournaments = (userId: string) => {
    return appState.tournaments.some(
      (tournament) => 
        tournament.participants.includes(userId) || 
        tournament.judgeId === userId
    );
  };

  const filteredAndSortedUsers = useMemo(() => {
    return appState.users
      .filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.username.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = selectedCity === "all" || user.city === selectedCity;
        return matchesSearch && matchesCity;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [appState.users, searchQuery, selectedCity]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Users" size={20} />
          Пользователи ({filteredAndSortedUsers.length} из {appState.users.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Поиск по имени или логину..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select 
            value={selectedCity} 
            onValueChange={setSelectedCity}
            disabled={appState.currentUser?.role === "judge"}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Все города" />
            </SelectTrigger>
            <SelectContent>
              {appState.currentUser?.role === "admin" && (
                <SelectItem value="all">Все города</SelectItem>
              )}
              {appState.currentUser?.role === "judge" ? (
                // Судьи видят только свой город
                appState.currentUser.city && (
                  <SelectItem value={appState.currentUser.city}>
                    {appState.currentUser.city}
                  </SelectItem>
                )
              ) : (
                // Админы видят все города
                appState.cities.map(city => (
                  <SelectItem key={city.id} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
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
              {filteredAndSortedUsers.map((user) => {
                const hasTournaments = userHasTournaments(user.id);
                return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono">{user.username}</td>
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.city || "-"}</td>
                  <td className="p-2">
                    {user.role === "admin" || appState.currentUser?.role === "judge" ? (
                      <Badge variant="default">{user.role}</Badge>
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(newRole: 'player' | 'judge' | 'admin') => 
                          updateUserRole(user.id, newRole)
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player">player</SelectItem>
                          <SelectItem value="judge">judge</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="p-2">
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Активен" : "Заблокирован"}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      {appState.currentUser?.role === "admin" && !(user.role === "admin") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.isActive ? "Заблокировать" : "Разблокировать"}
                        </Button>
                      )}
                      {user.id !== appState.currentUser?.id && !hasTournaments && (
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
              );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};