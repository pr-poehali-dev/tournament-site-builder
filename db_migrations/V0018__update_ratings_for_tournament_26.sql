-- Обновить рейтинги игроков турнира 26 на основе изменений в играх
UPDATE t_p79348767_tournament_site_buil.users u
SET rating = u.rating + (
  SELECT COALESCE(SUM(
    CASE 
      WHEN g.player1_id = u.id THEN g.player1_rating_change 
      WHEN g.player2_id = u.id THEN g.player2_rating_change 
      ELSE 0
    END
  ), 0)
  FROM t_p79348767_tournament_site_buil.games g
  WHERE (g.player1_id = u.id OR g.player2_id = u.id) 
    AND g.tournament_id = 26
)
WHERE u.id IN (12, 14, 16, 17, 18, 26, 29, 30, 31, 36, 39, 40, 41);