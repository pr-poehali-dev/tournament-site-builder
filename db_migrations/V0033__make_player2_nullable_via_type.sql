-- Make player2_id nullable by recreating it with same type but without NOT NULL
-- This is done by changing the column definition through ALTER TYPE
ALTER TABLE t_p79348767_tournament_site_buil.games 
ALTER COLUMN player2_id TYPE INTEGER USING player2_id;