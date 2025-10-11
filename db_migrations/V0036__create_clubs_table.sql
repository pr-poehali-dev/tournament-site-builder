-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on city for faster filtering
CREATE INDEX idx_clubs_city ON clubs(city);

-- Insert sample data
INSERT INTO clubs (name, city) VALUES 
    ('Спортивный клуб "Олимп"', 'Москва'),
    ('Клуб "Энергия"', 'Санкт-Петербург'),
    ('Футбольный клуб "Динамо"', 'Казань');
