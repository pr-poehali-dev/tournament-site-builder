import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { AppState } from '@/types';

interface RatingPageProps {
  appState: AppState;
}

export const RatingPage: React.FC<RatingPageProps> = ({ appState }) => {
  console.log('RatingPage rendering, players count:', appState.players.length);
  console.log('Players data:', appState.players);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="Award" size={20} className="mr-2" />
            Рейтинг игроков
          </CardTitle>
          <CardDescription>Общий рейтинг всех зарегистрированных игроков</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appState.players
              .sort((a, b) => b.rating - a.rating)
              .map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-4 rounded border bg-card">
                  <div className="flex items-center gap-4">
                    <Badge variant={index === 0 ? 'default' : index < 3 ? 'secondary' : 'outline'} className="w-8 h-8 flex items-center justify-center rounded-full">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium text-lg">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.city && `${player.city} • `}
                        {player.tournaments} турниров • 
                        {player.wins}П/{player.losses}Пр/{player.draws}Н
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{player.rating}</div>
                    <div className="text-xs text-muted-foreground">Рейтинг</div>
                  </div>
                </div>
              ))}
            {appState.players.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Award" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет игроков в рейтинге</p>
                <p className="text-sm mt-2">Игроки появятся после участия в турнирах</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};