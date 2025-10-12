
-- Турнир 48: Пересчёт результатов на основе актуальных игр

-- 1 место: Шлёнкин Юрий (17) - 4П 0Н 1Н = 13 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results 
SET place = 1, points = 13, wins = 4, losses = 0, draws = 1, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 17;

-- 2 место: Пятахин Герман (16) - 4П 0Н 1Н = 13 очков  
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 2, points = 13, wins = 4, losses = 0, draws = 1, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 16;

-- 3 место: Бурцев Дмитрий (12) - 4П 1Н 1Н = 13 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 3, points = 13, wins = 4, losses = 1, draws = 1, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 12;

-- 4 место: Спешнев Михаил (18) - 3П 0Н 2Н = 11 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 4, points = 11, wins = 3, losses = 0, draws = 2, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 18;

-- 5 место: Еремкин Данила (58) - 3П 1Н 0Н = 9 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 5, points = 9, wins = 3, losses = 1, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 58;

-- 6 место: Читаев Демьян (20) - 2П 0Н 2Н = 8 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 6, points = 8, wins = 2, losses = 0, draws = 2, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 20;

-- 7 место: Ермилов Виталий (22) - 2П 1Н 2Н = 8 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 7, points = 8, wins = 2, losses = 1, draws = 2, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 22;

-- 8 место: Лазутин Илья (19) - 2П 2Н 0Н = 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 8, points = 6, wins = 2, losses = 2, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 19;

-- 9 место: Мамонтов Максим (34) - 2П 2Н 0Н = 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 9, points = 6, wins = 2, losses = 2, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 34;

-- 10 место: Чикучинов Сергей (25) - 2П 2Н 0Н = 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 10, points = 6, wins = 2, losses = 2, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 25;

-- 11 место: Читаев Илья (13) - 2П 2Н 0Н = 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 11, points = 6, wins = 2, losses = 2, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 13;

-- 12 место: Денисов Егор (26) - 1П 0Н 3Н = 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 12, points = 6, wins = 1, losses = 0, draws = 3, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 26;

-- 13 место: Моисеев Данила (59) - 2П 2Н 0Н = 6 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 13, points = 6, wins = 2, losses = 2, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 59;

-- 14 место: Вербицкая Ирина (30) - 1П 0Н 2Н = 5 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 14, points = 5, wins = 1, losses = 0, draws = 2, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 30;

-- 15 место: Аникеев Иван (60) - 1П 1Н 2Н = 5 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 15, points = 5, wins = 1, losses = 1, draws = 2, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 60;

-- 16 место: Ерюкина Анастасия (27) - 1П 2Н 1Н = 4 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 16, points = 4, wins = 1, losses = 2, draws = 1, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 27;

-- 17 место: Герасимов Александр (57) - 1П 3Н 0Н = 3 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 17, points = 3, wins = 1, losses = 3, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 57;

-- 18 место: Шуваев Максим (56) - 1П 3Н 0Н = 3 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 18, points = 3, wins = 1, losses = 3, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 56;

-- 19 место: Конушкин Артём (36) - 0П 3Н 2Н = 2 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 19, points = 2, wins = 0, losses = 3, draws = 2, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 36;

-- 20 место: Шумаков Дмитрий (40) - 0П 4Н 0Н = 0 очков
UPDATE t_p79348767_tournament_site_buil.tournament_results
SET place = 20, points = 0, wins = 0, losses = 4, draws = 0, buchholz = 0, sum_buchholz = 0
WHERE tournament_id = 48 AND player_id = 40;
