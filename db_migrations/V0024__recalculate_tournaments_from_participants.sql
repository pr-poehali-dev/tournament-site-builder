-- Пересчитываем количество турниров для каждого игрока
-- на основе того, сколько раз они присутствуют в поле participants подтверждённых турниров

UPDATE users u
SET tournaments = (
  SELECT COUNT(*)
  FROM tournaments t
  WHERE t.status = 'confirmed'
    AND u.id = ANY(t.participants)
)
WHERE u.role = 'player';