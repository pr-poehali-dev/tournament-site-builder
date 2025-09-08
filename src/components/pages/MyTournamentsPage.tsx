import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { AppState, Page } from '@/types';

interface MyTournamentsPageProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
}

export const MyTournamentsPage: React.FC<MyTournamentsPageProps> = ({ appState, navigateTo }) => {
  const currentUserId = appState.currentUser?.id || '';
  const myTournaments = appState.tournaments.filter(tournament => 
    tournament.participants.includes(currentUserId)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="User" size={20} className="mr-2" />
            Мои турниры
          </CardTitle>
          <CardDescription>Турниры, в которых вы участвовали ({myTournaments.length})</CardDescription>
        </CardHeader>
        <CardContent>
          {myTournaments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет турниров</p>
              <p className="text-sm mt-2">Зарегистрируйтесь в турнире, чтобы он появился здесь</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTournaments.map((tournament) => {
                const totalRounds = tournament.swissRounds + tournament.topRounds;
                const completedRounds = tournament.rounds.length;
                const progress = totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0;
                
                return (
                  <div key={tournament.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{tournament.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={14} />
                            {tournament.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Users" size={14} />
                            {tournament.participants.length} игроков
                          </span>
                          <Badge variant={
                            tournament.status === 'active' ? 'default' :
                            tournament.status === 'completed' ? 'secondary' : 'outline'
                          }>
                            {tournament.status === 'active' ? 'Активный' :
                             tournament.status === 'completed' ? 'Завершён' : 'Ожидание'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Прогресс</div>
                        <div className="font-medium">{completedRounds}/{totalRounds} туров</div>
                        <div className="text-xs text-muted-foreground">{progress}%</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      {tournament.description}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        Швейцарка: {tournament.swissRounds} туров • 
                        Топ: {tournament.topRounds} туров
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigateTo('tournaments')}
                      >
                        Открыть турнир
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};