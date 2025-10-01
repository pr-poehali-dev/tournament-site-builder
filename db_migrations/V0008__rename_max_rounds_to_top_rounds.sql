-- Переименовываем столбец max_rounds в top_rounds
ALTER TABLE t_p79348767_tournament_site_buil.tournaments 
RENAME COLUMN max_rounds TO top_rounds;

-- Обновляем комментарий
COMMENT ON COLUMN t_p79348767_tournament_site_buil.tournaments.top_rounds IS 'Количество раундов TOP (плей-офф)';
