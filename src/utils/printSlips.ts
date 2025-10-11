import type { Tournament, User, Round } from "@/types";

export const generateSlipsHTML = (
  tournament: Tournament,
  round: Round,
  users: User[]
): string => {
  const slips: string[] = [];
  
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

    const slip = `<div class="slip">
${tournament.name} - ${tournamentDate} - Тур ${round.number} - Стол ${tableNumber}
-------------------------|-----------|------|------------------
Игрок                    | Результат | Дроп | Подпись
-------------------------|-----------|------|------------------
${(player1?.name || "Неизвестный").padEnd(24)} |           |      |
-------------------------|-----------|------|------------------
${(player2?.name || "Неизвестный").padEnd(24)} |           |      |
-------------------------|-----------|------|------------------
${"=".repeat(70)}
</div>`;
    
    slips.push(slip);
  });

  return slips.join("\n");
};

export const printSlips = (
  tournament: Tournament,
  round: Round,
  users: User[]
) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Пожалуйста, разрешите всплывающие окна для печати");
    return;
  }

  const content = generateSlipsHTML(tournament, round, users);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Слипы для турнира</title>
        <style>
          @page {
            margin: 1.5cm;
            size: A4;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .slip {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            line-height: 1.2;
            margin: 10px;
            color: #000;
            background: #fff;
          }
          .slip {
            white-space: pre-wrap;
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 10px;
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