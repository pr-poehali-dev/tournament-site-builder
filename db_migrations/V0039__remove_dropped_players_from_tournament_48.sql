UPDATE t_p79348767_tournament_site_buil.tournaments
SET participants = ARRAY(SELECT unnest(participants) EXCEPT SELECT unnest(ARRAY[39, 55]))
WHERE id = 48;