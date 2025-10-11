import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { AppState, Tournament } from '@/types';
import { canManageTournament } from '@/utils/permissions';

interface TournamentsPageProps {
  appState: AppState;
  goToCreateTournament: () => void;
  startEditTournament: (tournament: Tournament) => void;
  confirmTournament: (tournamentId: string) => void;
  deleteTournament: (tournamentId: string) => void;
  navigateTo: (page: any) => void;
}

export const TournamentsPage: React.FC<TournamentsPageProps> = ({
  appState,
  goToCreateTournament,
  startEditTournament,
  confirmTournament,
  deleteTournament
}) => {
  const currentUserId = appState.currentUser?.id || '';
  const isAdmin = appState.currentUser?.role === 'admin';
  const userCity = appState.currentUser?.city || '';
  
  const [selectedCity, setSelectedCity] = useState<string>('all');
  
  useEffect(() => {
    if (isAdmin && userCity) {
      setSelectedCity(userCity);
    }
  }, [isAdmin, userCity]);
  
  const visibleTournaments = appState.tournaments.filter(tournament => {
    if (isAdmin) {
      const matchesCity = selectedCity === 'all' || tournament.city === selectedCity;
      return matchesCity;
    }
    return tournament.judgeId === currentUserId;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon name="Trophy" size={20} className="mr-2" />
              Управление турнирами ({visibleTournaments.length})
            </div>
            <Button onClick={goToCreateTournament}>Новый турнир</Button>
          </CardTitle>
          <CardDescription>Создание и управление турнирами</CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin && (
            <div className="mb-4">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Все города" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все города</SelectItem>
                  {appState.cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {visibleTournaments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет турниров</p>
              <p className="text-sm mt-2">
                {isAdmin 
                  ? 'Создайте первый турнир, чтобы начать' 
                  : 'Вы пока не назначены судьей ни на один турнир'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTournaments.map(tournament => (
              <div key={tournament.id} className="flex items-center justify-between p-4 rounded border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Badge variant={tournament.status === 'draft' ? 'outline' : tournament.status === 'active' ? 'default' : 'secondary'}>
                    {tournament.status === 'draft' ? 'Черновик' : tournament.status === 'active' ? 'Активен' : 'Завершён'}
                  </Badge>
                  {tournament.status === 'confirmed' && (
                    <Badge variant="default" className="bg-green-600">
                      <Icon name="CheckCircle" size={12} className="mr-1" />
                      Подтверждён
                    </Badge>
                  )}
                  <div>
                    <div className="font-medium text-lg">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Icon name="Calendar" size={14} />
                      <span>{tournament.date ? new Date(tournament.date).toLocaleDateString('ru-RU') : 'Дата не указана'}</span>
                      <Icon name="MapPin" size={14} />
                      <span>{tournament.city}</span>
                      {tournament.club && (
                        <>
                          <Icon name="Building2" size={14} />
                          <span>{tournament.club}</span>
                        </>
                      )}
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
                  {canManageTournament(appState.currentUser, tournament) && (
                    <Button variant="outline" size="sm" onClick={() => startEditTournament(tournament)}>
                      <Icon name="Settings" size={14} className="mr-1" />
                      Управление
                    </Button>
                  )}
                  {appState.currentUser?.role === 'admin' && 
                   tournament.status === 'completed' && (
                    <Button variant="default" size="sm" onClick={() => confirmTournament(tournament.id)}>
                      <Icon name="CheckCircle" size={14} className="mr-1" />
                      Подтвердить турнир
                    </Button>
                  )}
                  {canManageTournament(appState.currentUser, tournament) && 
                   (!tournament.rounds || tournament.rounds.length === 0) && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        if (confirm('Удалить турнир? Это действие нельзя отменить.')) {
                          deleteTournament(tournament.id);
                        }
                      }}
                    >
                      <Icon name="Trash2" size={14} className="mr-1" />
                      Удалить
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
};