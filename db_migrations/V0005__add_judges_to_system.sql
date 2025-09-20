-- Добавляем судей в систему
INSERT INTO users (username, password, name, role, city, is_active) VALUES 
('judge_moscow', 'temp_password', 'Александр Судейкин', 'judge', 'Москва', true),
('judge_spb', 'temp_password', 'Мария Рефери', 'judge', 'Санкт-Петербург', true),
('judge_kazan', 'temp_password', 'Дмитрий Арбитров', 'judge', 'Казань', true);

-- Обновляем город для админа
UPDATE users SET city = 'Москва' WHERE username = 'admin';