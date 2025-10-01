-- Update games table to reference users instead of players
ALTER TABLE t_p79348767_tournament_site_buil.games
DROP CONSTRAINT IF EXISTS games_player1_id_fkey,
DROP CONSTRAINT IF EXISTS games_player2_id_fkey;

ALTER TABLE t_p79348767_tournament_site_buil.games
ADD CONSTRAINT games_player1_id_fkey 
  FOREIGN KEY (player1_id) REFERENCES t_p79348767_tournament_site_buil.users(id),
ADD CONSTRAINT games_player2_id_fkey 
  FOREIGN KEY (player2_id) REFERENCES t_p79348767_tournament_site_buil.users(id);