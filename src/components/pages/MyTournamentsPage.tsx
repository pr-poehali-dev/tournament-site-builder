import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import type { AppState, Page, Tournament } from '@/types';

interface MyTournamentsPageProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
}

export const MyTournamentsPage: React.FC<MyTournamentsPageProps> = ({ appState, navigateTo }) => {
  const currentUserId = appState.currentUser?.id || '';
  
  // Filter only confirmed tournaments where current user participated
  const myConfirmedTournaments = appState.tournaments.filter(tournament => 
    tournament.participants.includes(currentUserId) && tournament.confirmed
  );

  // Function to calculate player's place in tournament
  const getPlayerPlace = (tournament: Tournament, playerId: string): number => {
    if (!tournament.confirmed) return 0;
    
    // Calculate final scores for all participants
    const participantScores = tournament.participants.map(participantId => {
      let score = 0;
      let wins = 0;
      let draws = 0;
      
      // Count points from all matches
      tournament.rounds?.forEach(round => {
        const match = round.matches?.find(m => 
          m.player1Id === participantId || m.player2Id === participantId
        );
        
        if (match && match.result) {
          if (!match.player2Id) {
            // Bye - 1 point
            score += 1;
            wins += 1;
          } else {
            const isPlayer1 = match.player1Id === participantId;
            if (match.result === 'draw') {
              score += 0.5;
              draws += 1;
            } else if (
              (match.result === 'win1' && isPlayer1) ||
              (match.result === 'win2' && !isPlayer1)
            ) {
              score += 1;
              wins += 1;
            }
          }
        }
      });
      
      return {
        participantId,
        score,
        wins,
        draws,
        // Tiebreakers: wins first, then draws
        tiebreaker1: wins,
        tiebreaker2: draws
      };
    });

    // Sort by score (descending), then by tiebreakers
    participantScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.tiebreaker1 !== a.tiebreaker1) return b.tiebreaker1 - a.tiebreaker1;
      return b.tiebreaker2 - a.tiebreaker2;
    });

    // Find player's position
    const playerIndex = participantScores.findIndex(p => p.participantId === playerId);
    return playerIndex + 1;
  };

  // Format tournament type
  const formatTournamentType = (tournament: Tournament): string => {
    const swiss = tournament.swissRounds;
    const top = tournament.topRounds;
    
    if (swiss > 0 && top > 0) {
      return `Швейцарка ${swiss} + Топ ${top}`;
    } else if (swiss > 0) {
      return `Швейцарка ${swiss} туров`;
    } else if (top > 0) {
      return `Плей-офф ${top} туров`;
    }
    return 'Обычный турнир';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="Trophy" size={20} className="mr-2" />
            Мои турниры
          </CardTitle>
          <CardDescription>
            Подтверждённые турниры, в которых вы участвовали ({myConfirmedTournaments.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myConfirmedTournaments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет завершённых турниров</p>
              <p className="text-sm mt-2">Участвуйте в турнирах, чтобы они появились в истории</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название турнира</TableHead>
                  <TableHead>Формат</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Участников</TableHead>
                  <TableHead className="text-center">Место</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myConfirmedTournaments.map((tournament) => {
                  const place = getPlayerPlace(tournament, currentUserId);
                  const placeColor = place === 1 ? 'text-yellow-600' : 
                                   place === 2 ? 'text-gray-500' : 
                                   place === 3 ? 'text-orange-600' : 'text-muted-foreground';
                  
                  return (
                    <TableRow key={tournament.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {tournament.name}
                          {tournament.confirmed && (
                            <Badge variant="secondary" className="text-xs">
                              Подтверждён
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatTournamentType(tournament)}</TableCell>
                      <TableCell>{tournament.date}</TableCell>
                      <TableCell className="text-center">{tournament.participants.length}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${placeColor}`}>
                          {place === 1 ? '🥇 1' : 
                           place === 2 ? '🥈 2' : 
                           place === 3 ? '🥉 3' : place}
                          {place <= 3 && place > 0 ? '' : ' место'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};