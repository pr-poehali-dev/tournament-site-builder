import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import type { AppState, User, Player } from "@/types";
import { UserManagement } from "@/components/admin/UserManagement";
import { TournamentManagement } from "@/components/admin/TournamentManagement";

interface CombinedAdminPageProps {
  appState: AppState;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  addUser: (user: User) => void;
  addPlayer: (player: Player) => void;
  resetToInitialState?: () => void;
}

export const CombinedAdminPage: React.FC<CombinedAdminPageProps> = (props) => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="Settings" size={24} className="text-primary" />
        <h1 className="text-3xl font-bold">Админ-панель</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Icon name="Users" size={16} />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Icon name="Trophy" size={16} />
            Турниры (БД)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagement {...props} />
        </TabsContent>

        <TabsContent value="tournaments" className="mt-6">
          <TournamentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
