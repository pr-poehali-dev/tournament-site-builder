-- Добавляем поля для сброса пароля
ALTER TABLE users 
ADD COLUMN requires_password_reset BOOLEAN DEFAULT FALSE,
ADD COLUMN temporary_password VARCHAR(255) DEFAULT NULL;

-- Комментарии для полей
COMMENT ON COLUMN users.requires_password_reset IS 'Флаг необходимости сброса пароля (true/false)';
COMMENT ON COLUMN users.temporary_password IS 'Временный пароль в открытом виде (для сброса пароля)';