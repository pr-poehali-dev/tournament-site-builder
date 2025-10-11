import React from 'react';
import type { AppState } from '@/types';
import { ClubsManagement } from '@/components/admin/ClubsManagement';
import Icon from '@/components/ui/icon';

interface ClubsPageProps {
  appState: AppState;
}

export const ClubsPage: React.FC<ClubsPageProps> = ({ appState }) => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="Building2" size={24} className="text-primary" />
        <h1 className="text-3xl font-bold">Клубы</h1>
      </div>
      <ClubsManagement cities={appState.cities} />
    </div>
  );
};
