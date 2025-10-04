-- Сброс рейтингов игроков которые НЕ участвовали в подтверждённых турнирах
-- Только подтверждённые турниры (status = 'confirmed') должны влиять на рейтинг

-- Сбросить рейтинг к 1200 для игроков которые НЕ участвовали ни в одном подтверждённом турнире
UPDATE t_p79348767_tournament_site_buil.users
SET rating = 1200
WHERE id NOT IN (
  SELECT DISTINCT player_id FROM (
    SELECT player1_id as player_id FROM t_p79348767_tournament_site_buil.games g
    JOIN t_p79348767_tournament_site_buil.tournaments t ON g.tournament_id = t.id
    WHERE t.status = 'confirmed'
    UNION
    SELECT player2_id as player_id FROM t_p79348767_tournament_site_buil.games g
    JOIN t_p79348767_tournament_site_buil.tournaments t ON g.tournament_id = t.id
    WHERE t.status = 'confirmed'
  ) confirmed_players
);