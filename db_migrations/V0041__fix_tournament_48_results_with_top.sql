
-- Турнир 48: Правильный пересчёт с учётом швейцарки (раунды 1-4) и топа (5-7)
-- За топ очки НЕ начисляются, только места

-- МЕСТА по результатам ТОПа:
-- 1 место: Бурцев Дмитрий (12) - победитель финала
UPDATE t_p79348767_tournament_site_buil.tournament_results 
SET place = 1, points = 8, wins = 2, losses = 0, draws = 2
WHERE tournament_id = 48 AND player_id = 12;

-- 2 место: Пятахин Герман (16) - проиграл финал
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 2, points = 10, wins = 3, losses = 0, draws = 1
WHERE tournament_id = 48 AND player_id = 16;

-- 3-4 места: проигравшие в полуфиналах
-- Шлёнкин Юрий (17) - проиграл Бурцеву в раунде 6
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 3, points = 10, wins = 3, losses = 0, draws = 1
WHERE tournament_id = 48 AND player_id = 17;

-- Спешнев Михаил (18) - проиграл Пятахину в раунде 6  
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 4, points = 10, wins = 3, losses = 0, draws = 1
WHERE tournament_id = 48 AND player_id = 18;

-- 5-8 места: проигравшие в первом раунде топа (раунд 5)
-- Еремкин Данила (58) - 9 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 5, points = 9, wins = 3, losses = 1, draws = 0
WHERE tournament_id = 48 AND player_id = 58;

-- Читаев Демьян (20) - 8 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 6, points = 8, wins = 2, losses = 0, draws = 2
WHERE tournament_id = 48 AND player_id = 20;

-- Ермилов Виталий (22) - 8 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 7, points = 8, wins = 2, losses = 1, draws = 2
WHERE tournament_id = 48 AND player_id = 22;

-- Лазутин Илья (19) - 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 8, points = 6, wins = 2, losses = 2, draws = 0
WHERE tournament_id = 48 AND player_id = 19;

-- Остальные места по швейцарке (не попали в топ):
-- 9 место: Мамонтов Максим (34) - 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 9, points = 6, wins = 2, losses = 2, draws = 0
WHERE tournament_id = 48 AND player_id = 34;

-- 10 место: Чикучинов Сергей (25) - 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 10, points = 6, wins = 2, losses = 2, draws = 0
WHERE tournament_id = 48 AND player_id = 25;

-- 11 место: Читаев Илья (13) - 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 11, points = 6, wins = 2, losses = 2, draws = 0
WHERE tournament_id = 48 AND player_id = 13;

-- 12 место: Денисов Егор (26) - 6 очков (1-0-3)
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 12, points = 6, wins = 1, losses = 0, draws = 3
WHERE tournament_id = 48 AND player_id = 26;

-- 13 место: Моисеев Данила (59) - 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 13, points = 6, wins = 2, losses = 2, draws = 0
WHERE tournament_id = 48 AND player_id = 59;

-- 14 место: Вербицкая Ирина (30) - 5 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 14, points = 5, wins = 1, losses = 0, draws = 2
WHERE tournament_id = 48 AND player_id = 30;

-- 15 место: Аникеев Иван (60) - 5 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 15, points = 5, wins = 1, losses = 1, draws = 2
WHERE tournament_id = 48 AND player_id = 60;

-- 16 место: Ерюкина Анастасия (27) - 4 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 16, points = 4, wins = 1, losses = 2, draws = 1
WHERE tournament_id = 48 AND player_id = 27;

-- 17 место: Герасимов Александр (57) - 3 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 17, points = 3, wins = 1, losses = 3, draws = 0
WHERE tournament_id = 48 AND player_id = 57;

-- 18 место: Шуваев Максим (56) - 3 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 18, points = 3, wins = 1, losses = 3, draws = 0
WHERE tournament_id = 48 AND player_id = 56;

-- 19 место: Конушкин Артём (36) - 2 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 19, points = 2, wins = 0, losses = 3, draws = 2
WHERE tournament_id = 48 AND player_id = 36;

-- 20 место: Шумаков Дмитрий (40) - 0 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 20, points = 0, wins = 0, losses = 4, draws = 0
WHERE tournament_id = 48 AND player_id = 40;
