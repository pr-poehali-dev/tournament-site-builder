import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Tournament {
  id: number;
  name: string;
  type: 'top' | 'swiss';
  status: 'setup' | 'active' | 'completed';
  current_round: number;
  max_rounds?: number;
  created_at: string;
}

interface DBPlayer {
  id: number;
  tournament_id: number;
  name: string;
  points: number;
  buchholz: number;
  sum_buchholz: number;
  wins: number;
  draws: number;
  losses: number;
}

interface TournamentListAndPlayerProps {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  players: DBPlayer[];
  newPlayerName: string;
  setNewPlayerName: (value: string) => void;
  loadTournamentDetails: (tournamentId: number) => void;
  addPlayer: () => void;
  loading: boolean;
}

export const TournamentListAndPlayer: React.FC<TournamentListAndPlayerProps> = ({
  tournaments,
  selectedTournament,
  players,
  newPlayerName,
  setNewPlayerName,
  loadTournamentDetails,
  addPlayer,
  loading,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Турниры ({tournaments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Турниры не найдены</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className={`border rounded p-3 cursor-pointer transition-colors ${
                    selectedTournament?.id === tournament.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => loadTournamentDetails(tournament.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{tournament.name}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(tournament.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={tournament.type === 'top' ? 'default' : 'secondary'}>
                        {tournament.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{tournament.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTournament && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить игрока</CardTitle>
            <CardDescription>В турнир "{selectedTournament.name}"</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Имя игрока..."
                className="flex-1"
              />
              <Button onClick={addPlayer} disabled={loading}>
                Добавить
              </Button>
            </div>
            {players.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Игроки ({players.length}):</h5>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {players
                    .sort((a, b) => b.points - a.points)
                    .map((player, idx) => (
                      <div key={player.id} className="flex justify-between text-sm">
                        <span>
                          {idx + 1}. {player.name}
                        </span>
                        <span>{player.points} очков</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
