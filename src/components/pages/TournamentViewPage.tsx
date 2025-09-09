import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import type { AppState, Tournament, Page } from '@/types';

interface TournamentViewPageProps {
  appState: AppState;
  tournamentId: string;
  navigateTo: (page: Page) => void;
}

export const TournamentViewPage: React.FC<TournamentViewPageProps> = ({ 
  appState, 
  tournamentId, 
  navigateTo 
}) => {
  const currentUserId = appState.currentUser?.id || '';
  const tournament = appState.tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Icon name="Search" size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Турнир не найден</p>
            <Button 
              onClick={() => navigateTo('my-tournaments')} 
              className="mt-4"
            >
              Вернуться к моим турнирам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate final standings
  const calculateStandings = () => {
    return tournament.participants.map(participantId => {
      const player = appState.players.find(p => p.id === participantId);
      if (!player) return null;

      let score = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;
      const opponents: string[] = [];

      tournament.rounds?.forEach(round => {
        const match = round.matches?.find(m => 
          m.player1Id === participantId || m.player2Id === participantId
        );
        
        if (match && match.result) {
          if (!match.player2Id) {
            // Bye
            score += 1;
            wins += 1;
          } else {
            const isPlayer1 = match.player1Id === participantId;
            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
            opponents.push(opponentId);

            if (match.result === 'draw') {
              score += 0.5;
              draws += 1;
            } else if (
              (match.result === 'win1' && isPlayer1) ||
              (match.result === 'win2' && !isPlayer1)
            ) {
              score += 1;
              wins += 1;
            } else {
              losses += 1;
            }
          }
        }
      });

      return {
        player,
        score,
        wins,
        draws,
        losses,
        opponents,
        tiebreaker1: wins,
        tiebreaker2: draws
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (b.score !== a.score) return b.score - a.score;
      if (b.tiebreaker1 !== a.tiebreaker1) return b.tiebreaker1 - a.tiebreaker1;
      return b.tiebreaker2 - a.tiebreaker2;
    });
  };

  const standings = calculateStandings();



  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Trophy" size={20} />
                {tournament.name}
                {tournament.confirmed && (
                  <Badge variant="secondary">Подтверждён</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {tournament.date} • {tournament.city} • {tournament.participants.length} участников
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigateTo('my-tournaments')}
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Формат</div>
              <div className="font-medium">
                {tournament.swissRounds > 0 && tournament.topRounds > 0 
                  ? `Швейцарка ${tournament.swissRounds} + Топ ${tournament.topRounds}`
                  : tournament.swissRounds > 0 
                    ? `Швейцарка ${tournament.swissRounds} туров`
                    : `Плей-офф ${tournament.topRounds} туров`
                }
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Рейтинговый</div>
              <div className="font-medium">{tournament.isRated ? 'Да' : 'Нет'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Статус</div>
              <Badge variant={tournament.status === 'completed' ? 'secondary' : 'default'}>
                {tournament.status === 'completed' ? 'Завершён' : 
                 tournament.status === 'active' ? 'Активный' : 'Черновик'}
              </Badge>
            </div>
            <div>
              <div className="text-muted-foreground">Туров проведено</div>
              <div className="font-medium">{tournament.rounds?.length || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Content */}
      <Tabs defaultValue="standings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="standings">Турнирная таблица</TabsTrigger>
          <TabsTrigger value="rounds">Туры</TabsTrigger>
        </TabsList>

        {/* Standings Tab */}
        <TabsContent value="standings">
          <Card>
            <CardHeader>
              <CardTitle>Турнирная таблица</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">№</TableHead>
                    <TableHead>Игрок</TableHead>
                    <TableHead className="text-center">Рейтинг</TableHead>
                    <TableHead className="text-center">Очки</TableHead>
                    <TableHead className="text-center">Победы</TableHead>
                    <TableHead className="text-center">Ничьи</TableHead>
                    <TableHead className="text-center">Поражения</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((standing, index) => {
                    if (!standing) return null;
                    const isCurrentPlayer = standing.player.id === currentUserId;
                    
                    return (
                      <TableRow 
                        key={standing.player.id}
                        className={isCurrentPlayer ? 'bg-muted/50' : ''}
                      >
                        <TableCell className="font-medium">
                          {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : index + 1}
                        </TableCell>
                        <TableCell className={isCurrentPlayer ? 'font-bold' : ''}>
                          {standing.player.name}
                          {isCurrentPlayer && (
                            <Badge variant="outline" className="ml-2 text-xs">Вы</Badge>
                          )}
                        </TableCell>
                        <TableCell className={`text-center ${isCurrentPlayer ? 'font-bold' : ''}`}>
                          {standing.player.rating}
                        </TableCell>
                        <TableCell className={`text-center ${isCurrentPlayer ? 'font-bold' : ''}`}>
                          {standing.score}
                        </TableCell>
                        <TableCell className={`text-center ${isCurrentPlayer ? 'font-bold' : ''}`}>
                          {standing.wins}
                        </TableCell>
                        <TableCell className={`text-center ${isCurrentPlayer ? 'font-bold' : ''}`}>
                          {standing.draws}
                        </TableCell>
                        <TableCell className={`text-center ${isCurrentPlayer ? 'font-bold' : ''}`}>
                          {standing.losses}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rounds Tab */}
        <TabsContent value="rounds">
          <div className="space-y-4">
            {tournament.rounds?.map((round, roundIndex) => (
              <Card key={roundIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Тур {roundIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Стол</TableHead>
                        <TableHead>Игрок 1</TableHead>
                        <TableHead className="text-center">Результат</TableHead>
                        <TableHead>Игрок 2</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {round.matches?.map((match, matchIndex) => {
                        const player1 = appState.players.find(p => p.id === match.player1Id);
                        const player2 = match.player2Id ? appState.players.find(p => p.id === match.player2Id) : null;
                        const isPlayer1Current = match.player1Id === currentUserId;
                        const isPlayer2Current = match.player2Id === currentUserId;
                        const isCurrentPlayerMatch = isPlayer1Current || isPlayer2Current;

                        return (
                          <TableRow 
                            key={matchIndex}
                            className={isCurrentPlayerMatch ? 'bg-muted/50' : ''}
                          >
                            <TableCell>{matchIndex + 1}</TableCell>
                            <TableCell className={isPlayer1Current ? 'font-bold' : ''}>
                              {player1 ? player1.name : 'Неизвестный'}
                              {isPlayer1Current && (
                                <Badge variant="outline" className="ml-2 text-xs">Вы</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {!match.result ? (
                                <Badge variant="outline">Не сыграно</Badge>
                              ) : !player2 ? (
                                <Badge variant="secondary">БАЙ</Badge>
                              ) : match.result === 'draw' ? (
                                <Badge variant="secondary">Ничья</Badge>
                              ) : (
                                <Badge variant={
                                  (match.result === 'win1' && isPlayer1Current) ||
                                  (match.result === 'win2' && isPlayer2Current)
                                    ? 'default' : 'destructive'
                                }>
                                  {match.result === 'win1' ? '1-0' : '0-1'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className={isPlayer2Current ? 'font-bold' : ''}>
                              {player2 ? (
                                <>
                                  {player2.name}
                                  {isPlayer2Current && (
                                    <Badge variant="outline" className="ml-2 text-xs">Вы</Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground">БАЙ</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {(!tournament.rounds || tournament.rounds.length === 0) && (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Туры пока не проведены</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};