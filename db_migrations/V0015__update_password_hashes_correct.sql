-- Update passwords to correct bcrypt hashes

-- Admin password: 1qaz@WSX3edc
UPDATE t_p79348767_tournament_site_buil.users 
SET password = '$2b$10$3I6DyKsJ4jlxAd2mGQUb9.T7Wbp0yZ/wgf9BQruCLjK1nz8Qmsafa'
WHERE username = 'admin';

-- All other users password: 1234
UPDATE t_p79348767_tournament_site_buil.users 
SET password = '$2b$10$ml5/uHu.FL9rJwlpAmIGn.RfUppg9pBGuqn6FyazL0uMKyITFgPmW'
WHERE username LIKE 'user%';
