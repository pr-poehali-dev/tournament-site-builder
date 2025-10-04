-- Исправляем некорректные значения для конкретных пользователей
UPDATE users SET tournaments = 1 WHERE id IN (12, 14) AND role = 'player';