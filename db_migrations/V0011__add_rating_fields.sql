-- Add rating field to users table
ALTER TABLE t_p79348767_tournament_site_buil.users 
ADD COLUMN rating INTEGER NOT NULL DEFAULT 1200;

-- Add rating_change fields to games table (for both players)
ALTER TABLE t_p79348767_tournament_site_buil.games 
ADD COLUMN player1_rating_change INTEGER NULL,
ADD COLUMN player2_rating_change INTEGER NULL;

-- Add comments for documentation
COMMENT ON COLUMN t_p79348767_tournament_site_buil.users.rating IS 'Elo rating of the player, default 1200';
COMMENT ON COLUMN t_p79348767_tournament_site_buil.games.player1_rating_change IS 'Rating change for player1 after this game';
COMMENT ON COLUMN t_p79348767_tournament_site_buil.games.player2_rating_change IS 'Rating change for player2 after this game';