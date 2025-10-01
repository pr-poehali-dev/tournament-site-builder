-- Добавляем столбец format для хранения формата турнира (sealed, draft, constructed и т.д.)
ALTER TABLE t_p79348767_tournament_site_buil.tournaments 
ADD COLUMN format VARCHAR(50);

-- Добавляем комментарий
COMMENT ON COLUMN t_p79348767_tournament_site_buil.tournaments.format IS 'Формат турнира: sealed, draft, constructed и т.д.';
