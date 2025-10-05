import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Round, User, Tournament } from '@/types';

interface SeatingTableProps {
  round: Round;
  users: User[];
  tournament?: Tournament;
}

export const SeatingTable: React.FC<SeatingTableProps> = ({ round, users, tournament }) => {
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
              font-size: 10px;
            }
            h1 {
              text-align: center;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .info {
              text-align: center;
              margin-bottom: 10px;
              font-size: 9px;
              color: #666;
            }
            .info p {
              margin: 2px 0;
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
              padding: 4px 6px;
              text-align: left;
              font-size: 9px;
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
          <h1>Рассадка игроков</h1>
          ${tournament ? `
            <div class="info">
              <p><strong>Турнир:</strong> ${tournament.name}</p>
              <p><strong>Дата:</strong> ${tournament.date}</p>
            </div>
          ` : ''}
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
          <Button onClick={generatePDF} variant="outline" size="sm">
            <Icon name="Printer" size={16} className="mr-2" />
            Печать PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Игрок</th>
                <th className="text-left p-2 font-medium">№ стола</th>
              </tr>
            </thead>
            <tbody>
              {seatingData.map((seat, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{seat.playerName}</td>
                  <td className="p-2">{seat.tableNumber} {seat.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};