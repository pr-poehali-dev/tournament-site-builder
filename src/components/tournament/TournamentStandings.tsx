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

  const generateStandingsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const showTopStatus = tournament.topRounds > 0 && tournament.currentRound > tournament.swissRounds;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Турнирная таблица - ${tournament.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 15px;
              margin: 0;
              font-size: 12px;
            }
            h1 {
              text-align: center;
              font-size: 20px;
              margin-bottom: 3px;
              font-weight: bold;
            }
            .info {
              text-align: center;
              margin-bottom: 12px;
              font-size: 12px;
            }
            .info p {
              margin: 3px 0;
            }
            .title {
              text-align: center;
              font-size: 14px;
              margin-bottom: 12px;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #666;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f5f5f5;
            }
            .center {
              text-align: center;
            }
            .place-cell {
              text-align: center;
              width: 50px;
              font-weight: bold;
            }
            .points-cell {
              text-align: center;
              width: 50px;
              font-weight: bold;
            }
            .buch-cell {
              text-align: center;
              width: 50px;
            }
            .record-cell {
              text-align: center;
              width: 80px;
              font-size: 11px;
            }
            .status-cell {
              text-align: center;
              width: 100px;
            }
            .dropped {
              opacity: 0.5;
              background-color: #e0e0e0 !important;
            }
            @media print {
              body {
                padding: 10px;
              }
              @page {
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <h1>${tournament.name}</h1>
          <div class="info">
            <p>${tournament.date}</p>
          </div>
          <div class="title">Турнирная таблица</div>
          <table>
            <thead>
              <tr>
                <th class="place-cell">Место</th>
                <th>Игрок</th>
                <th class="points-cell">Очки</th>
                <th class="buch-cell">Бух.</th>
                <th class="buch-cell">Бух-2</th>
                <th class="record-cell">П-Н-П</th>
                ${showTopStatus ? '<th class="status-cell">Статус в топе</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${participants.map((participant, index) => {
                const isDropped = tournament.droppedPlayerIds?.includes(participant!.user.id) || false;
                const topStatus = showTopStatus ? getTopStatus(tournament, participant!.user.id) : '';
                return `
                  <tr${isDropped ? ' class="dropped"' : ''}>
                    <td class="place-cell">${index + 1}</td>
                    <td>${participant!.user.name}${isDropped ? ' (ДРОП)' : ''}</td>
                    <td class="points-cell">${participant!.points}</td>
                    <td class="buch-cell">${participant!.buchholz}</td>
                    <td class="buch-cell">${participant!.sumBuchholz}</td>
                    <td class="record-cell">${participant!.wins}-${participant!.draws}-${participant!.losses}</td>
                    ${showTopStatus ? `<td class="status-cell">${topStatus}</td>` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Турнирная таблица</CardTitle>
        {tournament.status !== 'completed' && tournament.status !== 'confirmed' && (
          <Button onClick={generateStandingsPDF} variant="outline" size="sm">
            <Icon name="Printer" size={16} className="mr-2" />
            Печать PDF
          </Button>
        )}
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
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};