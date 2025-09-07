import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface Player {
  id: string;
  name: string;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  opponents: string[];
}

interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  result: 'player1' | 'player2' | 'draw' | null;
  round: number;
}

interface Tournament {
  name: string;
  maxRounds: number;
  currentRound: number;
  status: 'setup' | 'swiss' | 'playoffs' | 'finished';
  players: Player[];
  matches: Match[];
}

const Index = () => {
  const [tournament, setTournament] = useState<Tournament>({
    name: '',
    maxRounds: 0,
    currentRound: 0,
    status: 'setup',
    players: [],
    matches: []
  });
  
  const [newPlayerName, setNewPlayerName] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [customRounds, setCustomRounds] = useState('');

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      score: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      opponents: []
    };
    
    setTournament(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
    
    setNewPlayerName('');
  };

  const removePlayer = (playerId: string) => {
    setTournament(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
  };

  const generateSwissPairings = () => {
    const players = [...tournament.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.wins - a.wins;
    });

    const matches: Match[] = [];
    const paired: Set<string> = new Set();

    for (let i = 0; i < players.length; i++) {
      if (paired.has(players[i].id)) continue;

      for (let j = i + 1; j < players.length; j++) {
        if (paired.has(players[j].id)) continue;
        if (players[i].opponents.includes(players[j].id)) continue;

        matches.push({
          id: Date.now() + Math.random(),
          player1Id: players[i].id,
          player2Id: players[j].id,
          result: null,
          round: tournament.currentRound + 1
        });

        paired.add(players[i].id);
        paired.add(players[j].id);
        break;
      }
    }

    if (players.length % 2 === 1) {
      const unpaired = players.find(p => !paired.has(p.id));
      if (unpaired) {
        matches.push({
          id: Date.now() + Math.random(),
          player1Id: unpaired.id,
          player2Id: 'bye',
          result: 'player1',
          round: tournament.currentRound + 1
        });
      }
    }

    setTournament(prev => ({
      ...prev,
      matches: [...prev.matches, ...matches],
      currentRound: prev.currentRound + 1
    }));
  };

  const startTournament = () => {
    if (tournament.players.length < 2 || !tournamentName.trim()) return;
    
    const suggestedRounds = Math.ceil(Math.log2(tournament.players.length));
    const maxRounds = customRounds ? parseInt(customRounds) : suggestedRounds;
    
    if (maxRounds < 1 || maxRounds > 20) return;
    
    setTournament(prev => ({
      ...prev,
      name: tournamentName,
      maxRounds,
      status: 'swiss'
    }));
    
    generateSwissPairings();
  };

  const submitResult = (matchId: string, result: 'player1' | 'player2' | 'draw') => {
    setTournament(prev => {
      const updatedMatches = prev.matches.map(match => 
        match.id === matchId ? { ...match, result } : match
      );

      const match = prev.matches.find(m => m.id === matchId);
      if (!match) return { ...prev, matches: updatedMatches };

      const updatedPlayers = prev.players.map(player => {
        if (player.id === match.player1Id) {
          const newScore = result === 'player1' ? player.score + 1 : result === 'draw' ? player.score + 0.5 : player.score;
          return {
            ...player,
            score: newScore,
            wins: result === 'player1' ? player.wins + 1 : player.wins,
            losses: result === 'player2' ? player.losses + 1 : player.losses,
            draws: result === 'draw' ? player.draws + 1 : player.draws,
            opponents: match.player2Id !== 'bye' ? [...player.opponents, match.player2Id] : player.opponents
          };
        }
        if (player.id === match.player2Id && match.player2Id !== 'bye') {
          const newScore = result === 'player2' ? player.score + 1 : result === 'draw' ? player.score + 0.5 : player.score;
          return {
            ...player,
            score: newScore,
            wins: result === 'player2' ? player.wins + 1 : player.wins,
            losses: result === 'player1' ? player.losses + 1 : player.losses,
            draws: result === 'draw' ? player.draws + 1 : player.draws,
            opponents: [...player.opponents, match.player1Id]
          };
        }
        return player;
      });

      return { ...prev, matches: updatedMatches, players: updatedPlayers };
    });
  };

  const nextRound = () => {
    const currentMatches = tournament.matches.filter(m => m.round === tournament.currentRound);
    const allMatchesComplete = currentMatches.every(m => m.result !== null);
    
    if (!allMatchesComplete) return;
    
    if (tournament.currentRound < tournament.maxRounds) {
      generateSwissPairings();
    } else {
      setTournament(prev => ({ ...prev, status: 'playoffs' }));
    }
  };

  const currentRoundMatches = tournament.matches.filter(m => m.round === tournament.currentRound);
  const sortedPlayers = [...tournament.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.wins - a.wins;
  });

  const getPlayerName = (playerId: string) => {
    if (playerId === 'bye') return 'БАЙ';
    return tournament.players.find(p => p.id === playerId)?.name || 'Неизвестный игрок';
  };

  if (tournament.status === 'setup') {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              <Icon name="Trophy" size={40} className="inline mr-3 text-primary" />
              Система турниров
            </h1>
            <p className="text-muted-foreground text-lg">Создайте турнир со швейцарской системой</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Settings" size={20} className="mr-2" />
                  Настройка турнира
                </CardTitle>
                <CardDescription>Укажите название турнира для начала</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tournament-name">Название турнира</Label>
                  <Input
                    id="tournament-name"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="Введите название турнира"
                  />
                </div>
                <div>
                  <Label htmlFor="rounds">Количество туров</Label>
                  <Input
                    id="rounds"
                    type="number"
                    min="1"
                    max="20"
                    value={customRounds}
                    onChange={(e) => setCustomRounds(e.target.value)}
                    placeholder={`Рекомендуется: ${tournament.players.length >= 2 ? Math.ceil(Math.log2(tournament.players.length)) : 1}`}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Рекомендуемое количество туров: {tournament.players.length >= 2 ? Math.ceil(Math.log2(tournament.players.length)) : 1}</p>
                  <p>Выбрано туров: {customRounds || (tournament.players.length >= 2 ? Math.ceil(Math.log2(tournament.players.length)) : 1)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Users" size={20} className="mr-2" />
                  Участники ({tournament.players.length})
                </CardTitle>
                <CardDescription>Добавьте участников турнира</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Имя участника"
                    onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  />
                  <Button onClick={addPlayer} size="sm">
                    <Icon name="Plus" size={16} />
                  </Button>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {tournament.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="font-medium">{player.name}</span>
                      <Button 
                        onClick={() => removePlayer(player.id)}
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Icon name="X" size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6">
            <Button 
              onClick={startTournament}
              disabled={
                tournament.players.length < 2 || 
                !tournamentName.trim() ||
                (customRounds && (parseInt(customRounds) < 1 || parseInt(customRounds) > 20))
              }
              size="lg"
              className="px-8"
            >
              <Icon name="Play" size={20} className="mr-2" />
              Начать турнир
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{tournament.name}</h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <Badge variant="outline">Тур {tournament.currentRound} из {tournament.maxRounds}</Badge>
            <Badge variant={tournament.status === 'swiss' ? 'default' : 'secondary'}>
              {tournament.status === 'swiss' ? 'Швейцарская система' : 'Плей-офф'}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="Swords" size={20} className="mr-2" />
                Текущий тур - паринги
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentRoundMatches.length === 0 && tournament.status === 'swiss' && (
                <div className="text-center py-8">
                  <Button onClick={() => generateSwissPairings()}>
                    Создать паринги
                  </Button>
                </div>
              )}
              
              {currentRoundMatches.map((match) => (
                <div key={match.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{getPlayerName(match.player1Id)}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="font-medium">{getPlayerName(match.player2Id)}</span>
                    </div>
                    {match.result && (
                      <Badge variant="outline">
                        {match.result === 'player1' ? getPlayerName(match.player1Id) : 
                         match.result === 'player2' ? getPlayerName(match.player2Id) : 'Ничья'}
                      </Badge>
                    )}
                  </div>
                  
                  {match.player2Id !== 'bye' && !match.result && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => submitResult(match.id, 'player1')}
                        variant="outline"
                      >
                        Победил {getPlayerName(match.player1Id)}
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => submitResult(match.id, 'draw')}
                        variant="outline"
                      >
                        Ничья
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => submitResult(match.id, 'player2')}
                        variant="outline"
                      >
                        Победил {getPlayerName(match.player2Id)}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
              {currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.result !== null) && tournament.currentRound < tournament.maxRounds && (
                <div className="text-center pt-4">
                  <Button onClick={nextRound}>
                    <Icon name="ArrowRight" size={16} className="mr-2" />
                    Следующий тур
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="Crown" size={20} className="mr-2" />
                Рейтинговая таблица
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedPlayers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">{player.score} очков</span>
                      <span>{player.wins}П</span>
                      <span>{player.losses}П</span>
                      <span>{player.draws}Н</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;