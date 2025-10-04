-- Пересчитываем количество турниров для каждого игрока
-- на основе уникальных подтверждённых турниров, в которых они участвовали

UPDATE users u
SET tournaments = (
  SELECT COUNT(DISTINCT g.tournament_id)
  FROM games g
  JOIN tournaments t ON g.tournament_id = t.id
  WHERE t.status = 'confirmed'
    AND (g.player1_id = u.id OR g.player2_id = u.id)
)
WHERE u.role = 'player';