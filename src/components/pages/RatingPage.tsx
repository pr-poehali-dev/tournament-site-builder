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
          {appState.players.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Award" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет игроков в рейтинге</p>
              <p className="text-sm mt-2">Игроки появятся после участия в турнирах</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Место</th>
                    <th className="text-left p-3 font-medium">Игрок</th>
                    <th className="text-left p-3 font-medium">Город</th>
                    <th className="text-left p-3 font-medium">Турниров</th>
                    <th className="text-right p-3 font-medium">Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {appState.players
                    .sort((a, b) => b.rating - a.rating)
                    .map((player, index) => (
                      <tr key={player.id} className="border-b hover:bg-accent/50 transition-colors">
                        <td className="p-3">
                          <Badge 
                            variant={index === 0 ? 'default' : index < 3 ? 'secondary' : 'outline'} 
                            className="w-8 h-8 flex items-center justify-center rounded-full"
                          >
                            {index + 1}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-base">{player.name}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-muted-foreground">
                            {player.city || '—'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{player.tournaments}</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="text-xl font-bold text-primary">{player.rating}</div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};