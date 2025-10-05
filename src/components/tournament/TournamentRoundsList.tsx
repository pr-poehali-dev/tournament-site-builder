import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import type { AppState, Tournament, Round } from '@/types';
import { SeatingTable } from './SeatingTable';

interface TournamentRoundsListProps {
  tournament: Tournament;
  appState: AppState;
  updateMatchResult: (tournamentId: string, roundId: string, matchId: string, result: string) => void;
  togglePlayerDrop: (tournamentId: string, playerId: string) => void;
}

export const TournamentRoundsList: React.FC<TournamentRoundsListProps> = ({
  tournament,
  appState,
  updateMatchResult,
  togglePlayerDrop,
}) => {
  if (!tournament.rounds || tournament.rounds.length === 0) {
    return null;
  }

  const generateRoundPDF = (round: Round) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Calculate points for each player before this round
    const playerPoints = new Map<string, number>();
    tournament.participants.forEach(participantId => {
      let points = 0;
      tournament.rounds?.forEach(r => {
        // Only count completed rounds BEFORE this round (not including current round)
        if (r.number < round.number && r.number > 0) {
          const match = r.matches?.find(m => m.player1Id === participantId || m.player2Id === participantId);
          if (match) {
            if (!match.player2Id) {
              // BYE always gives 3 points
              points += 3;
            } else if (match.result) {
              // Regular match with result
              const isPlayer1 = match.player1Id === participantId;
              if (match.result === 'draw') {
                points += 1;
              } else if (
                (match.result === 'win1' && isPlayer1) ||
                (match.result === 'win2' && !isPlayer1)
              ) {
                points += 3;
              }
            }
          }
        }
      });
      playerPoints.set(participantId, points);
    });
    
    // Create flat list with each player as a row
    const pairingsData = round.matches
      .flatMap(match => {
        const player1 = appState.users.find(u => u.id === match.player1Id);
        const player2 = match.player2Id ? appState.users.find(u => u.id === match.player2Id) : null;
        
        const player1Points = playerPoints.get(match.player1Id) || 0;
        const player2Points = match.player2Id ? (playerPoints.get(match.player2Id) || 0) : 0;
        
        const results = [];
        
        // For BYE match (no player2), only add one entry for player1
        if (!match.player2Id) {
          if (player1) {
            results.push({
              playerName: player1.name,
              playerPoints: player1Points,
              opponentName: 'БАЙ',
              opponentPoints: 0,
            });
          }
        } else {
          // Regular match - add both players
          if (player1) {
            results.push({
              playerName: player1.name,
              playerPoints: player1Points,
              opponentName: player2?.name || 'Неизвестный',
              opponentPoints: player2Points,
            });
          }
          
          if (player2) {
            results.push({
              playerName: player2.name,
              playerPoints: player2Points,
              opponentName: player1?.name || 'Неизвестный',
              opponentPoints: player1Points,
            });
          }
        }
        
        return results;
      })
      .sort((a, b) => a.playerName.localeCompare(b.playerName, 'ru'));

    const halfLength = Math.ceil(pairingsData.length / 2);
    const leftColumn = pairingsData.slice(0, halfLength);
    const rightColumn = pairingsData.slice(halfLength);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Тур ${round.number} - Паринги</title>
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
            .round-title {
              text-align: center;
              font-size: 12px;
              margin-bottom: 12px;
              text-indent: 1em;
            }
            .columns {
              display: flex;
              gap: 15px;
            }
            .column {
              flex: 1;
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
            .vs-cell {
              text-align: center;
              color: #666;
              width: 30px;
            }
            .points-cell {
              text-align: center;
              width: 40px;
              font-weight: bold;
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
          <div class="round-title">Тур ${round.number}</div>
          <div class="columns">
            <div class="column">
              <table>
                <thead>
                  <tr>
                    <th>Игрок</th>
                    <th style="width: 40px; text-align: center;">Очки</th>
                    <th style="width: 30px;"></th>
                    <th style="width: 40px; text-align: center;">Очки</th>
                    <th>Оппонент</th>
                  </tr>
                </thead>
                <tbody>
                  ${leftColumn.map(pairing => `
                    <tr>
                      <td>${pairing.playerName}</td>
                      <td class="points-cell">${pairing.playerPoints}</td>
                      <td class="vs-cell">vs</td>
                      <td class="points-cell">${pairing.opponentPoints}</td>
                      <td>${pairing.opponentName}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="column">
              <table>
                <thead>
                  <tr>
                    <th>Игрок</th>
                    <th style="width: 40px; text-align: center;">Очки</th>
                    <th style="width: 30px;"></th>
                    <th style="width: 40px; text-align: center;">Очки</th>
                    <th>Оппонент</th>
                  </tr>
                </thead>
                <tbody>
                  ${rightColumn.map(pairing => `
                    <tr>
                      <td>${pairing.playerName}</td>
                      <td class="points-cell">${pairing.playerPoints}</td>
                      <td class="vs-cell">vs</td>
                      <td class="points-cell">${pairing.opponentPoints}</td>
                      <td>${pairing.opponentName}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
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
      <CardHeader>
        <CardTitle>Туры турнира</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tournament.rounds?.map((round) => {
          if (round.number === 0) {
            return <SeatingTable key={round.id} round={round} users={appState.users} tournament={tournament} />;
          }
          
          return (
          <div key={round.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Тур {round.number}</h3>
              <div className="flex items-center gap-2">
                <Button onClick={() => generateRoundPDF(round)} variant="outline" size="sm">
                  <Icon name="Printer" size={16} className="mr-2" />
                  Печать PDF
                </Button>
                <Badge variant={round.isCompleted ? "default" : "secondary"}>
                  {round.isCompleted ? "Завершён" : "В процессе"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              {round.matches
                .sort((a, b) => {
                  // БАЙ в конец
                  if (!a.player2Id) return 1;
                  if (!b.player2Id) return -1;
                  // Остальные по номеру стола
                  return (a.tableNumber || 0) - (b.tableNumber || 0);
                })
                .map((match) => {
                const player1 = appState.users.find((u) => u.id === match.player1Id);
                const player2 = match.player2Id
                  ? appState.users.find((u) => u.id === match.player2Id)
                  : null;

                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-medium min-w-[60px]">
                        {match.player2Id ? `Стол ${match.tableNumber}` : "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{player1?.name || "Неизвестный игрок"}</span>
                        <span className="text-gray-500">vs</span>
                        <span>{player2?.name || "БАЙ"}</span>
                      </div>
                    </div>

                    {match.result ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {match.result === "win1" && (player1?.name || "Игрок 1")}
                          {match.result === "win2" && (player2?.name || "Игрок 2")}
                          {match.result === "draw" && "Ничья"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {match.points1}:{match.points2}
                        </span>
                        {tournament.rounds &&
                          round.number === tournament.rounds.length && (
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant={match.result === "win1" ? "default" : "outline"}
                                onClick={() =>
                                  updateMatchResult(
                                    tournament.id,
                                    round.id,
                                    match.id,
                                    "win1",
                                  )
                                }
                              >
                                3-0
                              </Button>
                              <Button
                                size="sm"
                                variant={match.result === "draw" ? "default" : "outline"}
                                onClick={() =>
                                  updateMatchResult(
                                    tournament.id,
                                    round.id,
                                    match.id,
                                    "draw",
                                  )
                                }
                              >
                                1-1
                              </Button>
                              <Button
                                size="sm"
                                variant={match.result === "win2" ? "default" : "outline"}
                                onClick={() =>
                                  updateMatchResult(
                                    tournament.id,
                                    round.id,
                                    match.id,
                                    "win2",
                                  )
                                }
                              >
                                0-3
                              </Button>
                            </div>
                          )}
                      </div>
                    ) : !match.player2Id ? (
                      <Badge variant="secondary">БАЙ</Badge>
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMatchResult(
                              tournament.id,
                              round.id,
                              match.id,
                              "win1",
                            )
                          }
                        >
                          3-0
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMatchResult(
                              tournament.id,
                              round.id,
                              match.id,
                              "draw",
                            )
                          }
                        >
                          1-1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMatchResult(
                              tournament.id,
                              round.id,
                              match.id,
                              "win2",
                            )
                          }
                        >
                          0-3
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
};