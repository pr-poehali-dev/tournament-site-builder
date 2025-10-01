-- Добавляем столбцы для расширенной информации о турнире
ALTER TABLE t_p79348767_tournament_site_buil.tournaments 
ADD COLUMN city VARCHAR(100),
ADD COLUMN is_rated BOOLEAN DEFAULT true,
ADD COLUMN judge_id INTEGER,
ADD COLUMN participants INTEGER[] DEFAULT '{}';

-- Добавляем комментарии для документации
COMMENT ON COLUMN t_p79348767_tournament_site_buil.tournaments.city IS 'Город проведения турнира';
COMMENT ON COLUMN t_p79348767_tournament_site_buil.tournaments.is_rated IS 'Рейтинговый турнир или нет';
COMMENT ON COLUMN t_p79348767_tournament_site_buil.tournaments.judge_id IS 'ID судьи турнира из таблицы users';
COMMENT ON COLUMN t_p79348767_tournament_site_buil.tournaments.participants IS 'Массив ID участников турнира';
