import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";

interface Tournament {
  id: number;
  name: string;
  type: 'top' | 'swiss';
  status: 'setup' | 'active' | 'completed';
  current_round: number;
  max_rounds?: number;
  created_at: string;
}

interface Player {
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

interface Game {
  id: number;
  round_number: number;
  result?: string;
  player1_name: string;
  player2_name: string;
  player1_id: number;
  player2_id: number;
}

const TOURNAMENT_API_URL = "https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45";

export const NewAdminPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Form states
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentType, setNewTournamentType] = useState<'top' | 'swiss'>('top');
  const [newPlayerName, setNewPlayerName] = useState("");

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch(TOURNAMENT_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (err: any) {
      setError(`Ошибка загрузки турниров: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async (tournamentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${TOURNAMENT_API_URL}/${tournamentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedTournament(data.tournament);
      setPlayers(data.players || []);
      setGames(data.games || []);
    } catch (err: any) {
      setError(`Ошибка загрузки деталей турнира: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async () => {
    if (!newTournamentName.trim()) {
      setError("Введите название турнира");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(TOURNAMENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTournamentName,
          type: newTournamentType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTournaments([data.tournament, ...tournaments]);
      setNewTournamentName("");
      setError("");
    } catch (err: any) {
      setError(`Ошибка создания турнира: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async () => {
    if (!selectedTournament || !newPlayerName.trim()) {
      setError("Выберите турнир и введите имя игрока");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(TOURNAMENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_player',
          tournament_id: selectedTournament.id,
          name: newPlayerName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPlayers([...players, data.player]);
      setNewPlayerName("");
      setError("");
    } catch (err: any) {
      setError(`Ошибка добавления игрока: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentSelect = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === parseInt(tournamentId));
    if (tournament) {
      setSelectedTournament(tournament);
      loadTournamentDetails(tournament.id);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="Settings" size={24} className="text-primary" />
        <h1 className="text-3xl font-bold">Админ-панель</h1>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <Icon name="AlertCircle" size={20} />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Tournament */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Plus" size={20} />
            Создать турнир
          </CardTitle>
          <CardDescription>
            Создайте новый турнир в базе данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="tournament-name">Название турнира</Label>
              <Input
                id="tournament-name"
                value={newTournamentName}
                onChange={(e) => setNewTournamentName(e.target.value)}
                placeholder="Введите название..."
              />
            </div>
            <div>
              <Label htmlFor="tournament-type">Тип турнира</Label>
              <Select value={newTournamentType} onValueChange={(value: 'top' | 'swiss') => setNewTournamentType(value)}>
                <SelectTrigger id="tournament-type" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">TOP</SelectItem>
                  <SelectItem value="swiss">Swiss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={createTournament}
              disabled={loading || !newTournamentName.trim()}
            >
              {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Создать
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tournament List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Trophy" size={20} />
            Турниры ({tournaments.length})
          </CardTitle>
          <CardDescription>
            Выберите турнир для управления
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Турниры не найдены</p>
              <p className="text-sm">Создайте первый турнир выше</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {tournaments.map((tournament) => (
                <div 
                  key={tournament.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTournament?.id === tournament.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTournamentSelect(tournament.id.toString())}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{tournament.name}</h3>
                      <p className="text-sm text-gray-600">
                        Создан: {new Date(tournament.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tournament.type === 'top' ? 'default' : 'secondary'}>
                        {tournament.type.toUpperCase()}
                      </Badge>
                      <Badge variant={
                        tournament.status === 'active' ? 'default' : 
                        tournament.status === 'completed' ? 'secondary' : 'outline'
                      }>
                        {tournament.status === 'setup' ? 'Настройка' : 
                         tournament.status === 'active' ? 'Активный' : 'Завершен'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tournament Management */}
      {selectedTournament && (
        <>
          {/* Add Player */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="UserPlus" size={20} />
                Добавить игрока
              </CardTitle>
              <CardDescription>
                Добавить игрока в турнир "{selectedTournament.name}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="player-name">Имя игрока</Label>
                  <Input
                    id="player-name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Введите имя игрока..."
                  />
                </div>
                <Button 
                  onClick={addPlayer}
                  disabled={loading || !newPlayerName.trim()}
                >
                  {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
                  Добавить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" size={20} />
                Игроки ({players.length})
              </CardTitle>
              <CardDescription>
                Список игроков турнира "{selectedTournament.name}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Игроки не найдены</p>
                  <p className="text-sm">Добавьте первого игрока выше</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">№</th>
                        <th className="p-2 text-left">Игрок</th>
                        <th className="p-2 text-center">Очки</th>
                        <th className="p-2 text-center">Бухгольц</th>
                        <th className="p-2 text-center">Сум.Бухгольц</th>
                        <th className="p-2 text-center">П-Н-П</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players
                        .sort((a, b) => {
                          if (a.points !== b.points) return b.points - a.points;
                          if (a.buchholz !== b.buchholz) return b.buchholz - a.buchholz;
                          return b.sum_buchholz - a.sum_buchholz;
                        })
                        .map((player, index) => (
                          <tr key={player.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-semibold">{index + 1}</td>
                            <td className="p-2">{player.name}</td>
                            <td className="p-2 text-center font-semibold">{player.points}</td>
                            <td className="p-2 text-center">{player.buchholz}</td>
                            <td className="p-2 text-center">{player.sum_buchholz}</td>
                            <td className="p-2 text-center">
                              {player.wins}-{player.draws}-{player.losses}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Games List */}
          {games.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="GameController2" size={20} />
                  Игры ({games.length})
                </CardTitle>
                <CardDescription>
                  История игр турнира "{selectedTournament.name}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Тур</th>
                        <th className="p-2 text-left">Игрок 1</th>
                        <th className="p-2 text-center">Результат</th>
                        <th className="p-2 text-right">Игрок 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games
                        .sort((a, b) => {
                          if (a.round_number !== b.round_number) return a.round_number - b.round_number;
                          return a.id - b.id;
                        })
                        .map((game) => (
                          <tr key={game.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">Тур {game.round_number}</td>
                            <td className="p-2">{game.player1_name}</td>
                            <td className="p-2 text-center font-mono">
                              {game.result ? (
                                <Badge variant={
                                  game.result === '1-0' ? 'default' :
                                  game.result === '0-1' ? 'secondary' : 'outline'
                                }>
                                  {game.result}
                                </Badge>
                              ) : (
                                <Badge variant="outline">—</Badge>
                              )}
                            </td>
                            <td className="p-2 text-right">{game.player2_name}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader2" size={24} className="animate-spin mr-2" />
          <span>Загрузка...</span>
        </div>
      )}
    </div>
  );
};