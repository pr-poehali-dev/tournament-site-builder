import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Round, User } from '@/types';

interface SeatingTableProps {
  round: Round;
  users: User[];
}

export const SeatingTable: React.FC<SeatingTableProps> = ({ round, users }) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Рассадка игроков</CardTitle>
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
