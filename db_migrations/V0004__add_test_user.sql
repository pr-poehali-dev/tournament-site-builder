-- Добавление тестового пользователя для проверки API
INSERT INTO t_p79348767_tournament_site_buil.users 
(username, password, name, role, city, is_active) 
VALUES ('test_manual', 'test123', 'Тестовый пользователь', 'player', 'Москва', true);