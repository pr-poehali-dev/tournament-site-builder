import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Round, User, Tournament } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SeatingEditorProps {
  round: Round;
  users: User[];
  tournament: Tournament;
  onSave: (tournamentId: string, roundId: string, matches: any[]) => void;
  onCancel: () => void;
}

export const SeatingEditor: React.FC<SeatingEditorProps> = ({
  round,
  users,
  tournament,
  onSave,
  onCancel,
}) => {
  const [editedMatches, setEditedMatches] = useState([...round.matches]);

  const availablePlayerIds = new Set(tournament.participants);
  const seatedPlayerIds = new Set(
    editedMatches.flatMap(m => [m.player1Id, m.player2Id].filter(Boolean))
  );

  const unassignedPlayers = users.filter(
    u => availablePlayerIds.has(u.id) && !seatedPlayerIds.has(u.id)
  );

  const handlePlayerChange = (matchIndex: number, position: 'player1' | 'player2', playerId: string | null) => {
    const newMatches = [...editedMatches];
    if (position === 'player1') {
      newMatches[matchIndex].player1Id = playerId || '';
    } else {
      newMatches[matchIndex].player2Id = playerId || '';
    }
    setEditedMatches(newMatches);
  };

  const handleAddTable = () => {
    const maxTable = Math.max(...editedMatches.map(m => m.tableNumber || 0), 0);
    setEditedMatches([
      ...editedMatches,
      {
        id: `match-${Date.now()}-${Math.random()}`,
        player1Id: '',
        player2Id: '',
        tableNumber: maxTable + 1,
      },
    ]);
  };

  const handleRemoveTable = (matchIndex: number) => {
    const newMatches = editedMatches.filter((_, i) => i !== matchIndex);
    setEditedMatches(newMatches);
  };

  const handleSave = () => {
    // Validate: all players must be assigned
    const allSeated = editedMatches.every(m => m.player1Id && m.player2Id);
    const allPlayersCounted = editedMatches.flatMap(m => [m.player1Id, m.player2Id]).filter(Boolean).length;
    
    if (!allSeated) {
      alert('Все столы должны быть полностью заполнены');
      return;
    }

    if (allPlayersCounted !== tournament.participants.length) {
      alert(`Должно быть рассажено ${tournament.participants.length} игроков, сейчас рассажено ${allPlayersCounted}`);
      return;
    }

    // Check for duplicates
    const playerIds = editedMatches.flatMap(m => [m.player1Id, m.player2Id]);
    const uniqueIds = new Set(playerIds);
    if (uniqueIds.size !== playerIds.length) {
      alert('Каждый игрок может быть рассажен только один раз');
      return;
    }

    // Renumber tables to ensure sequential numbering
    const sortedMatches = [...editedMatches].sort((a, b) => (a.tableNumber || 0) - (b.tableNumber || 0));
    const renumberedMatches = sortedMatches.map((match, index) => ({
      ...match,
      tableNumber: index + 1
    }));

    onSave(tournament.id, round.id, renumberedMatches);
  };

  const getPlayerSelectOptions = (currentPlayerId: string | null) => {
    const currentlySeated = new Set(
      editedMatches
        .flatMap(m => [m.player1Id, m.player2Id])
        .filter(Boolean)
        .filter(id => id !== currentPlayerId)
    );

    return users.filter(u => 
      availablePlayerIds.has(u.id) && (!currentlySeated.has(u.id) || u.id === currentPlayerId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon name="Edit" size={20} />
            Редактирование рассадки
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Icon name="Check" size={16} className="mr-2" />
              Сохранить
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <Icon name="X" size={16} className="mr-2" />
              Отмена
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {unassignedPlayers.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm font-medium mb-2">Не рассажены ({unassignedPlayers.length}):</p>
            <div className="text-sm text-gray-700">
              {unassignedPlayers.map(p => p.name).join(', ')}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {editedMatches
            .sort((a, b) => (a.tableNumber || 0) - (b.tableNumber || 0))
            .map((match, index) => (
              <div key={match.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="font-medium min-w-[70px]">
                  Стол {match.tableNumber}
                </div>
                
                <div className="flex-1">
                  <Select
                    value={match.player1Id || 'empty'}
                    onValueChange={(value) => 
                      handlePlayerChange(index, 'player1', value === 'empty' ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выбрать игрока (слева)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">— Не выбрано —</SelectItem>
                      {getPlayerSelectOptions(match.player1Id).map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-gray-500">vs</div>

                <div className="flex-1">
                  <Select
                    value={match.player2Id || 'empty'}
                    onValueChange={(value) => 
                      handlePlayerChange(index, 'player2', value === 'empty' ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выбрать игрока (справа)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">— Не выбрано —</SelectItem>
                      {getPlayerSelectOptions(match.player2Id).map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTable(index)}
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            ))}
        </div>

        <Button onClick={handleAddTable} variant="outline" className="w-full">
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить стол
        </Button>

        <div className="text-sm text-gray-600 pt-2 border-t">
          <p>Всего участников: {tournament.participants.length}</p>
          <p>Рассажено: {editedMatches.flatMap(m => [m.player1Id, m.player2Id].filter(Boolean)).length}</p>
          <p>Столов: {editedMatches.length}</p>
        </div>
      </CardContent>
    </Card>
  );
};