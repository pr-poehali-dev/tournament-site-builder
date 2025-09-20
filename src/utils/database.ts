import type { Tournament } from '@/types';

export const saveTournamentToDatabase = async (tournament: Tournament): Promise<boolean> => {
  try {
    // Создаем SQL для вставки турнира
    const escapedName = tournament.name.replace(/'/g, "''");
    const escapedFormat = tournament.format.replace(/'/g, "''");
    const escapedCity = tournament.city?.replace(/'/g, "''") || '';
    
    const sql = `
-- Добавление турнира: ${escapedName}
INSERT INTO t_p79348767_tournament_site_buil.tournaments 
(name, type, status, current_round, max_rounds) 
VALUES ('${escapedName}', '${escapedFormat}', 'setup', 0, NULL);
    `;
    
    // Отправляем SQL на backend для выполнения
    const response = await fetch('/api/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: sql,
        description: `Добавление турнира: ${tournament.name}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.success === true;
    
  } catch (error) {
    console.error('Failed to save tournament to database:', error);
    return false;
  }
};

export const getTournamentsFromDatabase = async (): Promise<any[]> => {
  try {
    const sql = `
SELECT id, name, type, status, current_round, max_rounds, created_at 
FROM t_p79348767_tournament_site_buil.tournaments 
ORDER BY created_at DESC;
    `;
    
    const response = await fetch('/api/query-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: sql
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data || [];
    
  } catch (error) {
    console.error('Failed to get tournaments from database:', error);
    return [];
  }
};