-- Разрешить значение 'confirmed' для поля status
ALTER TABLE t_p79348767_tournament_site_buil.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_status_check;

ALTER TABLE t_p79348767_tournament_site_buil.tournaments 
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('setup', 'active', 'completed', 'confirmed'));