import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Round, User, Tournament } from '@/types';

interface SeatingTableProps {
  round: Round;
  users: User[];
  tournament?: Tournament;
  onEdit?: () => void;
}

export const SeatingTable: React.FC<SeatingTableProps> = ({ round, users, tournament, onEdit }) => {
  const seatingData = round.matches
    .flatMap((match) => {
      const player1 = users.find((u) => u.id === match.player1Id);
      const player2 = match.player2Id ? users.find((u) => u.id === match.player2Id) : null;
      
      const results = [];
      
      if (player1) {
        results.push({
          playerName: player1.name,
          tableNumber: match.tableNumber || 0,
          position: 'слева' as const,
        });
      }
      
      if (player2) {
        results.push({
          playerName: player2.name,
          tableNumber: match.tableNumber || 0,
          position: 'справа' as const,
        });
      }
      
      return results;
    })
    .sort((a, b) => a.playerName.localeCompare(b.playerName, 'ru'));

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const halfLength = Math.ceil(seatingData.length / 2);
    const leftColumn = seatingData.slice(0, halfLength);
    const rightColumn = seatingData.slice(halfLength);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Рассадка игроков</title>
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
            .seating-title {
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
          ${tournament ? `
            <h1>${tournament.name}</h1>
            <div class="info">
              <p>${tournament.date}</p>
            </div>
            <div class="seating-title">Рассадка игроков</div>
          ` : '<h1>Рассадка игроков</h1>'}
          <div class="columns">
            <div class="column">
              <table>
                <thead>
                  <tr>
                    <th>Игрок</th>
                    <th>Стол</th>
                  </tr>
                </thead>
                <tbody>
                  ${leftColumn.map(seat => `
                    <tr>
                      <td>${seat.playerName}</td>
                      <td>${seat.tableNumber} ${seat.position}</td>
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
                    <th>Стол</th>
                  </tr>
                </thead>
                <tbody>
                  ${rightColumn.map(seat => `
                    <tr>
                      <td>${seat.playerName}</td>
                      <td>${seat.tableNumber} ${seat.position}</td>
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
        <div className="flex items-center justify-between">
          <CardTitle>Рассадка игроков</CardTitle>
          <div className="flex gap-2">
            {onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                <Icon name="Edit" size={16} className="mr-2" />
                Изменить
              </Button>
            )}
            <Button onClick={generatePDF} variant="outline" size="sm">
              <Icon name="Printer" size={16} className="mr-2" />
              Печать PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {round.matches
            .sort((a, b) => (a.tableNumber || 0) - (b.tableNumber || 0))
            .map((match) => {
              const player1 = users.find((u) => u.id === match.player1Id);
              const player2 = match.player2Id
                ? users.find((u) => u.id === match.player2Id)
                : null;

              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="font-medium min-w-[70px]">
                      Стол {match.tableNumber}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm text-gray-500 min-w-[50px]">Слева:</span>
                      <span className="font-medium">{player1?.name || "Неизвестный игрок"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm text-gray-500 min-w-[60px]">Справа:</span>
                    <span className="font-medium">{player2?.name || "Неизвестный игрок"}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};