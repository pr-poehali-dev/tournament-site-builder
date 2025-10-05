-- Create tournament_results table to store final player standings
CREATE TABLE IF NOT EXISTS t_p79348767_tournament_site_buil.tournament_results (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    place INTEGER NOT NULL,
    points INTEGER NOT NULL,
    buchholz INTEGER DEFAULT 0,
    sum_buchholz INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, player_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id 
ON t_p79348767_tournament_site_buil.tournament_results(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_results_player_id 
ON t_p79348767_tournament_site_buil.tournament_results(player_id);