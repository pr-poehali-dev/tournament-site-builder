import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Tournament } from '@/types';

interface TournamentHeaderProps {
  tournament: Tournament;
}

export const TournamentHeader: React.FC<TournamentHeaderProps> = ({ tournament }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Trophy" size={20} />
          {tournament.name}
        </CardTitle>
        <CardDescription>
          {tournament.date} • {tournament.city} • {tournament.format}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
