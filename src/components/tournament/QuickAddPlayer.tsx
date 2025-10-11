import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { AppState, Tournament } from '@/types';
import { SimplePlayerSearch } from '@/components/ui/simple-player-search';

interface QuickAddPlayerProps {
  tournament: Tournament;
  appState: AppState;
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => void;
}

export const QuickAddPlayer: React.FC<QuickAddPlayerProps> = ({
  tournament,
  appState,
  updateTournament,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const handleAdd = () => {
    if (selectedPlayers.length === 0) {
      alert('Выберите хотя бы одного игрока');
      return;
    }

    const newPlayers = selectedPlayers.filter(
      id => !tournament.participants.includes(id)
    );

    if (newPlayers.length === 0) {
      alert('Все выбранные игроки уже участвуют в турнире');
      return;
    }

    const playerNames = newPlayers
      .map(id => appState.users.find(u => u.id === id)?.name || 'Игрок')
      .join(', ');

    let message = '';
    if (tournament.currentRound === 0) {
      message = `Добавить игрока(ов) ${playerNames} в турнир?`;
    } else {
      message = `Игрок(и) ${playerNames} будут добавлены в турнир и начнут участвовать в парингах со следующего тура (тур ${tournament.currentRound + 1}). Продолжить?`;
    }

    if (confirm(message)) {
      const updatedParticipants = [...tournament.participants, ...newPlayers];
      updateTournament(tournament.id, { participants: updatedParticipants });
      setSelectedPlayers([]);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setSelectedPlayers([]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => setIsOpen(true)} className="w-full">
            <Icon name="UserPlus" size={16} className="mr-2" />
            Добавить игрока в турнир
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="UserPlus" size={20} />
          Добавить игрока в турнир
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tournament.currentRound > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            <Icon name="Info" size={16} className="inline mr-2" />
            Новые игроки начнут участвовать в парингах со следующего тура (тур {tournament.currentRound + 1})
          </div>
        )}

        <SimplePlayerSearch
          players={appState.users}
          cities={appState.cities}
          selectedPlayerIds={selectedPlayers}
          onPlayersChange={setSelectedPlayers}
          placeholder="Найти и добавить игроков..."
          defaultCityFilter={tournament.city}
        />

        <div className="flex gap-2">
          <Button onClick={handleAdd}>
            <Icon name="Check" size={16} className="mr-2" />
            Добавить ({selectedPlayers.length})
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
