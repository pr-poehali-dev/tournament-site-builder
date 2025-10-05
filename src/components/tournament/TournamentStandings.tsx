import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { AppState, Tournament } from '@/types';
import { getTopStatus, calculateTournamentStandings } from '@/utils/tournamentHelpers';

interface TournamentStandingsProps {
  tournament: Tournament;
  appState: AppState;
  togglePlayerDrop?: (tournamentId: string, playerId: string) => void;
}

export const TournamentStandings: React.FC<TournamentStandingsProps> = ({
  tournament,
  appState,
  togglePlayerDrop,
}) => {
  const participants = calculateTournamentStandings(tournament, appState.users);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Турнирная таблица</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Место</th>
                <th className="text-left p-2 font-medium">Игрок</th>
                <th className="text-left p-2 font-medium">Очки</th>
                <th className="text-left p-2 font-medium">Бух.</th>
                <th className="text-left p-2 font-medium">Бух-2</th>
                <th className="text-left p-2 font-medium">П-Н-П</th>
                {tournament.topRounds > 0 &&
                  tournament.currentRound > tournament.swissRounds && (
                    <th className="text-left p-2 font-medium">Статус в топе</th>
                  )}
                {togglePlayerDrop && (
                  <th className="text-left p-2 font-medium">Дроп</th>
                )}
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => {
                const isDropped = tournament.droppedPlayerIds?.includes(participant!.user.id) || false;
                return (
                  <tr
                    key={participant!.user.id}
                    className={`border-b hover:bg-gray-50 ${isDropped ? 'opacity-50 bg-gray-100' : ''}`}
                  >
                    <td className="p-2">
                      <Badge variant="outline">{index + 1}</Badge>
                    </td>
                    <td className="p-2 font-medium">
                      {participant!.user.name}
                      {isDropped && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          ДРОП
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">{participant!.points}</td>
                    <td className="p-2">{participant!.buchholz}</td>
                    <td className="p-2">{participant!.sumBuchholz}</td>
                    <td className="p-2 text-sm text-gray-600">
                      {participant!.wins}-{participant!.draws}-
                      {participant!.losses}
                    </td>
                    {tournament.topRounds > 0 &&
                      tournament.currentRound > tournament.swissRounds && (
                        <td className="p-2 text-sm">
                          <span className="font-medium">
                            {getTopStatus(tournament, participant!.user.id)}
                          </span>
                        </td>
                      )}
                    {togglePlayerDrop && (
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant={isDropped ? "default" : "outline"}
                          onClick={() => togglePlayerDrop(tournament.id, participant!.user.id)}
                        >
                          <Icon name={isDropped ? "UserCheck" : "UserX"} size={14} className="mr-1" />
                          {isDropped ? 'Вернуть' : 'Дроп'}
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};