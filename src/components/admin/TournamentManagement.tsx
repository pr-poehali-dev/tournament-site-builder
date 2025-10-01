import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { TournamentCreationForm } from "./TournamentCreationForm";
import { TournamentListAndPlayer } from "./TournamentListAndPlayer";

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

export const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<DBPlayer[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTournamentName,
          type: newTournamentType,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_player',
          tournament_id: selectedTournament.id,
          name: newPlayerName,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  return (
    <div className="space-y-6">
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

      <TournamentCreationForm
        newTournamentName={newTournamentName}
        setNewTournamentName={setNewTournamentName}
        newTournamentType={newTournamentType}
        setNewTournamentType={setNewTournamentType}
        createTournament={createTournament}
        loading={loading}
      />

      <TournamentListAndPlayer
        tournaments={tournaments}
        selectedTournament={selectedTournament}
        players={players}
        newPlayerName={newPlayerName}
        setNewPlayerName={setNewPlayerName}
        loadTournamentDetails={loadTournamentDetails}
        addPlayer={addPlayer}
        loading={loading}
      />
    </div>
  );
};
