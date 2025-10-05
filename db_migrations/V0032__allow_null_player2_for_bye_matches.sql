-- Allow NULL for player2_id to support BYE matches
ALTER TABLE t_p79348767_tournament_site_buil.games 
ALTER COLUMN player2_id SET DEFAULT NULL;