import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AppState, Tournament } from "@/types";
import { getTopStatus, calculateTournamentStandings } from "@/utils/tournamentHelpers";

interface StandingsTabProps {
  tournament: Tournament;
  appState: AppState;
  currentUserId: string;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({
  tournament,
  appState,
  currentUserId,
}) => {
  const standings = calculateTournamentStandings(tournament, appState.users);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Турнирная таблица</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium">Место</th>
                <th className="text-left p-2 font-medium">Игрок</th>
                <th className="text-left p-2 font-medium">Очки</th>
                <th className="text-left p-2 font-medium">Бух</th>
                <th className="text-left p-2 font-medium">Бух-2</th>
                <th className="text-left p-2 font-medium">П-Н-П</th>
                {tournament.topRounds > 0 &&
                  tournament.currentRound > tournament.swissRounds && (
                    <th className="text-left p-2 font-medium">
                      Статус в топе
                    </th>
                  )}
              </tr>
            </thead>
            <tbody>
              {standings.map((participant, index) => {
                if (!participant) return null;
                const isCurrentPlayer = participant.user.id === currentUserId;

                return (
                  <tr
                    key={participant.user.id}
                    className={`border-b hover:bg-gray-50 ${
                      isCurrentPlayer ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="p-2">
                      <Badge variant="outline">{index + 1}</Badge>
                    </td>
                    <td
                      className={`p-2 ${isCurrentPlayer ? "font-bold" : "font-medium"}`}
                    >
                      {participant.user.name}
                      {isCurrentPlayer && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Вы
                        </Badge>
                      )}
                    </td>
                    <td
                      className={`p-2 ${isCurrentPlayer ? "font-bold" : ""}`}
                    >
                      {participant.points}
                    </td>
                    <td
                      className={`p-2 ${isCurrentPlayer ? "font-bold" : ""}`}
                    >
                      {participant.buchholz}
                    </td>
                    <td
                      className={`p-2 ${isCurrentPlayer ? "font-bold" : ""}`}
                    >
                      {participant.sumBuchholz}
                    </td>
                    <td
                      className={`p-2 text-sm text-gray-600 ${isCurrentPlayer ? "font-bold" : ""}`}
                    >
                      {participant.wins}-{participant.draws}-
                      {participant.losses}
                    </td>
                    {tournament.topRounds > 0 &&
                      tournament.currentRound > tournament.swissRounds && (
                        <td
                          className={`p-2 text-sm ${isCurrentPlayer ? "font-bold" : ""}`}
                        >
                          <span className="font-medium">
                            {getTopStatus(tournament, participant.user.id)}
                          </span>
                        </td>
                      )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};