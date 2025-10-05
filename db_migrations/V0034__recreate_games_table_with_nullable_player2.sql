-- Create new games table with nullable player2_id
CREATE TABLE t_p79348767_tournament_site_buil.games_new (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NULL,  -- Allow NULL for BYE matches
    result VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    player1_rating_change INTEGER,
    player2_rating_change INTEGER,
    is_bye BOOLEAN DEFAULT FALSE,
    table_number INTEGER,
    CONSTRAINT games_new_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES t_p79348767_tournament_site_buil.users(id),
    CONSTRAINT games_new_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES t_p79348767_tournament_site_buil.users(id),
    CONSTRAINT games_new_result_check CHECK (result IN ('win1', 'win2', 'draw'))
);

-- Copy all existing data from old table to new table
INSERT INTO t_p79348767_tournament_site_buil.games_new 
    (id, tournament_id, round_number, player1_id, player2_id, result, created_at, updated_at, 
     player1_rating_change, player2_rating_change, is_bye, table_number)
SELECT 
    id, tournament_id, round_number, player1_id, player2_id, result, created_at, updated_at,
    player1_rating_change, player2_rating_change, is_bye, table_number
FROM t_p79348767_tournament_site_buil.games;

-- Update sequence to continue from current max id
SELECT setval('t_p79348767_tournament_site_buil.games_new_id_seq', 
    (SELECT COALESCE(MAX(id), 1) FROM t_p79348767_tournament_site_buil.games_new));

-- Rename old table to backup
ALTER TABLE t_p79348767_tournament_site_buil.games 
RENAME TO games_backup_old;

-- Rename new table to games
ALTER TABLE t_p79348767_tournament_site_buil.games_new 
RENAME TO games;