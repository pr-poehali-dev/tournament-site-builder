CREATE TABLE IF NOT EXISTS tournament_formats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    coefficient DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tournament_formats_name ON tournament_formats(name);

INSERT INTO tournament_formats (name, coefficient) VALUES 
    ('Силед', 1.00),
    ('Драфт', 1.00),
    ('Констрактед', 1.00)
ON CONFLICT (name) DO NOTHING;