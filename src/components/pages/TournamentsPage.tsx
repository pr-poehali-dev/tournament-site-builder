import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { AppState, Tournament } from '@/types';

interface TournamentsPageProps {
  appState: AppState;
  createTournament: () => void;
  startEditTournament: (tournament: Tournament) => void;
  confirmTournament: (tournamentId: string) => void;
}

export const TournamentsPage: React.FC<TournamentsPageProps> = ({
  appState,
  createTournament,
  startEditTournament,
  confirmTournament
}) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon name="Trophy" size={20} className="mr-2" />
            Управление турнирами ({appState.tournaments.length})
          </div>
          <Button onClick={createTournament}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать турнир
          </Button>
        </CardTitle>
        <CardDescription>Создание и управление турнирами</CardDescription>
      </CardHeader>
      <CardContent>
        {appState.tournaments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Пока нет турниров</p>
            <p className="text-sm mt-2">Создайте первый турнир, чтобы начать</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appState.tournaments.map(tournament => (
              <div key={tournament.id} className="flex items-center justify-between p-4 rounded border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Badge variant={tournament.status === 'draft' ? 'outline' : tournament.status === 'active' ? 'default' : 'secondary'}>
                    {tournament.status === 'draft' ? 'Черновик' : tournament.status === 'active' ? 'Активен' : 'Завершён'}
                  </Badge>
                  {tournament.status === 'completed' && tournament.confirmed && (
                    <Badge variant="default" className="bg-green-600">
                      <Icon name="CheckCircle" size={12} className="mr-1" />
                      Подтверждён
                    </Badge>
                  )}
                  <div>
                    <div className="font-medium text-lg">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Icon name="Calendar" size={14} />
                      <span>{tournament.date}</span>
                      <Icon name="MapPin" size={14} />
                      <span>{tournament.city}</span>
                      <Icon name="Layers" size={14} />
                      <span>{tournament.format}</span>
                      <Icon name="Users" size={14} />
                      <span>{tournament.participants.length} участников</span>
                      {tournament.isRated && (
                        <Badge variant="secondary" className="text-xs">Рейтинговый</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Icon name="Eye" size={14} className="mr-1" />
                    Просмотр
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startEditTournament(tournament)}>
                    <Icon name="Settings" size={14} className="mr-1" />
                    Управление
                  </Button>
                  {appState.currentUser?.role === 'admin' && 
                   tournament.status === 'completed' && 
                   !tournament.confirmed && (
                    <Button variant="default" size="sm" onClick={() => confirmTournament(tournament.id)}>
                      <Icon name="CheckCircle" size={14} className="mr-1" />
                      Подтвердить турнир
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);