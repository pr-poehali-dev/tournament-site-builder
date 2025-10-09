import React from "react";
import Icon from "@/components/ui/icon";
import type { AppState, User, Player } from "@/types";
import { UserManagement } from "@/components/admin/UserManagement";

interface CombinedAdminPageProps {
  appState: AppState;
  toggleUserStatus: (userId: string) => void;
  updateUserRole: (userId: string, newRole: 'player' | 'judge' | 'admin') => void;
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
        <h1 className="text-3xl font-bold">Игроки</h1>
      </div>

      <UserManagement {...props} />
    </div>
  );
};