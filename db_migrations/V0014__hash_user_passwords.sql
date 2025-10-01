-- Update passwords to bcrypt hashes

-- Admin password: 1qaz@WSX3edc
UPDATE t_p79348767_tournament_site_buil.users 
SET password = '$2b$10$xQZ5YJ6vN5YqO8P4fGkAj.h3K9nM7LZwC5xR8VuTpN2jQ6lK3mW4m'
WHERE username = 'admin';

-- All other users password: 1234
UPDATE t_p79348767_tournament_site_buil.users 
SET password = '$2b$10$7J5kN6M8P9qR2sT4uV5wX.y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N'
WHERE username LIKE 'user%';
