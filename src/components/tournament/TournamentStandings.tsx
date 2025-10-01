import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AppState, Tournament } from '@/types';
import { getTopStatus, calculateTournamentStandings } from '@/utils/tournamentHelpers';

interface TournamentStandingsProps {
  tournament: Tournament;
  appState: AppState;
}

export const TournamentStandings: React.FC<TournamentStandingsProps> = ({
  tournament,
  appState,
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
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => (
                <tr
                  key={participant!.user.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-2">
                    <Badge variant="outline">{index + 1}</Badge>
                  </td>
                  <td className="p-2 font-medium">{participant!.user.name}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};