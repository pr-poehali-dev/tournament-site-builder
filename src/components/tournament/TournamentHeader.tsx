import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { Tournament, AppState } from '@/types';
import { SimplePlayerSearch } from '@/components/ui/simple-player-search';

interface TournamentHeaderProps {
  tournament: Tournament;
  appState?: AppState;
  updateTournament?: (tournamentId: string, updates: Partial<Tournament>) => void;
}

export const TournamentHeader: React.FC<TournamentHeaderProps> = ({ tournament, appState, updateTournament }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: tournament.name,
    date: tournament.date,
    city: tournament.city,
    format: tournament.format,
    swissRounds: tournament.swissRounds,
    topRounds: tournament.topRounds,
    participants: tournament.participants || []
  });

  const handleSave = () => {
    if (updateTournament) {
      updateTournament(tournament.id, editForm);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: tournament.name,
      date: tournament.date,
      city: tournament.city,
      format: tournament.format,
      swissRounds: tournament.swissRounds,
      topRounds: tournament.topRounds,
      participants: tournament.participants || []
    });
    setIsEditing(false);
  };

  const handleParticipantsChange = (playerIds: string[]) => {
    setEditForm(prev => ({
      ...prev,
      participants: playerIds
    }));
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Icon name="Trophy" size={20} />
                {tournament.name}
              </CardTitle>
              <CardDescription>
                {tournament.date} • {tournament.city} • {tournament.format} • 
                Швейцарка: {tournament.swissRounds} • Топ: {tournament.topRounds} • 
                Участников: {tournament.participants?.length || 0}
              </CardDescription>
            </div>
            {appState && updateTournament && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Icon name="Edit" size={16} className="mr-2" />
                Редактировать
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Edit" size={20} />
          Редактирование турнира
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Название турнира</Label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Дата турнира</Label>
            <Input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Город</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editForm.city}
              onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
            >
              {appState?.cities.map(city => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Формат</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editForm.format}
              onChange={(e) => setEditForm(prev => ({ ...prev, format: e.target.value }))}
            >
              {appState?.tournamentFormats.map(format => (
                <option key={format.id} value={format.name}>
                  {format.name} (коэф. {format.coefficient})
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Туры швейцарки (1-8)</Label>
            <Input
              type="number"
              min="1"
              max="8"
              value={editForm.swissRounds}
              onChange={(e) => setEditForm(prev => ({ ...prev, swissRounds: parseInt(e.target.value) || 3 }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Туры топа</Label>
            <Input
              type="number"
              min="0"
              value={editForm.topRounds}
              onChange={(e) => setEditForm(prev => ({ ...prev, topRounds: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {appState && (
          <div className="space-y-2">
            <Label>Участники турнира ({editForm.participants.length})</Label>
            <SimplePlayerSearch
              players={appState.users}
              cities={appState.cities}
              selectedPlayerIds={editForm.participants}
              onPlayersChange={handleParticipantsChange}
              placeholder="Найти и добавить участников..."
              defaultCityFilter={editForm.city}
            />
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleSave}>
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <Icon name="X" size={16} className="mr-2" />
            Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};