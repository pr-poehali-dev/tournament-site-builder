-- Fix top_rounds for tournament 56
UPDATE t_p79348767_tournament_site_buil.tournaments 
SET top_rounds = 2 
WHERE id = 56 AND top_rounds IS NULL;