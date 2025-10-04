CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cities_name ON cities(name);

INSERT INTO cities (name) VALUES 
    ('Москва'),
    ('Рязань'),
    ('Санкт-Петербург')
ON CONFLICT (name) DO NOTHING;