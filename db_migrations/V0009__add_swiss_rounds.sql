-- Добавляем столбец swiss_rounds для хранения количества швейцарских раундов
ALTER TABLE t_p79348767_tournament_site_buil.tournaments 
ADD COLUMN swiss_rounds INTEGER DEFAULT 3;

-- Добавляем комментарий
COMMENT ON COLUMN t_p79348767_tournament_site_buil.tournaments.swiss_rounds IS 'Количество швейцарских раундов';
