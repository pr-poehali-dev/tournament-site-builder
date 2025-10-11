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
      updateTournament(tournament.id, {
        name: editForm.name,
        swissRounds: editForm.swissRounds,
        topRounds: editForm.topRounds,
        participants: editForm.participants
      });
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

  const getPlayersInPairings = (): Set<string> => {
    const playersInPairings = new Set<string>();
    tournament.rounds?.forEach(round => {
      round.matches?.forEach(match => {
        if (match.player1Id) playersInPairings.add(match.player1Id);
        if (match.player2Id) playersInPairings.add(match.player2Id);
      });
    });
    return playersInPairings;
  };

  const handleParticipantsChange = (playerIds: string[]) => {
    const playersInPairings = getPlayersInPairings();
    const removedPlayers = editForm.participants.filter(id => !playerIds.includes(id));
    
    for (const playerId of removedPlayers) {
      if (playersInPairings.has(playerId)) {
        const playerName = appState?.users.find(u => u.id === playerId)?.name || 'Игрок';
        alert(`Невозможно удалить игрока "${playerName}", так как он участвует в парингах`);
        return;
      }
    }
    
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
                {tournament.date ? new Date(tournament.date).toLocaleDateString('ru-RU') : 'Дата не указана'} • {tournament.city} • {tournament.format} • 
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название турнира</Label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Дата:</strong> {tournament.date ? new Date(tournament.date).toLocaleDateString('ru-RU') : 'Дата не указана'}</p>
              <p><strong>Город:</strong> {tournament.city}</p>
              <p><strong>Формат:</strong> {tournament.format}</p>
              <p className="text-xs mt-2 italic">Эти параметры нельзя изменить после создания турнира</p>
            </div>
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