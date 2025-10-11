import type { Tournament, User, Round } from "@/types";

export const generateSlipsContent = (
  tournament: Tournament,
  round: Round,
  users: User[]
): string => {
  const lines: string[] = [];
  
  round.matches?.forEach((match, index) => {
    const player1 = users.find((u) => u.id === match.player1Id);
    const player2 = match.player2Id
      ? users.find((u) => u.id === match.player2Id)
      : null;

    if (!player2) {
      return;
    }

    const tournamentDate = tournament.date
      ? new Date(tournament.date).toLocaleDateString("ru-RU")
      : "Дата не указана";
    const tableNumber = index + 1;

    lines.push("");
    lines.push(
      `${tournament.name} - ${tournamentDate} - Тур ${round.number} - Стол ${tableNumber}`
    );
    lines.push("");
    lines.push("Игрок                    | Результат | Дроп | Подпись");
    lines.push("-------------------------|-----------|------|------------------");
    lines.push(
      `${(player1?.name || "Неизвестный").padEnd(24)} |           |      |`
    );
    lines.push(
      `${(player2?.name || "Неизвестный").padEnd(24)} |           |      |`
    );
    lines.push("");
    lines.push("=".repeat(70));
    lines.push("");
  });

  return lines.join("\n");
};

export const printSlips = (content: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Пожалуйста, разрешите всплывающие окна для печати");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Слипы для турнира</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12pt;
            line-height: 1.4;
            white-space: pre-wrap;
            margin: 20px;
          }
        </style>
      </head>
      <body>
${content}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
};