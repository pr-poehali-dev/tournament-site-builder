import React from "react";
import type { AppState, User, Player } from "@/types";
import { UserCreationForm } from "./UserCreationForm";
import { UsersList } from "./UsersList";

interface UserManagementProps {
  appState: AppState;
  toggleUserStatus: (userId: string) => void;
  updateUserRole: (userId: string, newRole: 'player' | 'judge' | 'admin') => void;
  deleteUser: (userId: string) => void;
  addUser: (user: User) => void;
  addPlayer: (player: Player) => void;
  resetToInitialState?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  appState,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  addUser,
  addPlayer,
  resetToInitialState,
}) => {
  return (
    <div className="space-y-6">
      <UserCreationForm appState={appState} addUser={addUser} addPlayer={addPlayer} />
      <UsersList appState={appState} toggleUserStatus={toggleUserStatus} updateUserRole={updateUserRole} deleteUser={deleteUser} />
    </div>
  );
};