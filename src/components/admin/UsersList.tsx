import React from "react";
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
  return (
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
                    {user.role === "admin" && appState.currentUser?.role === "admin" ? (
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
                      {!(user.role === "admin" && appState.currentUser?.role === "admin") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.isActive ? "Заблокировать" : "Разблокировать"}
                        </Button>
                      )}
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
  );
};