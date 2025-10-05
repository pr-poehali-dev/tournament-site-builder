-- Create table for tracking login attempts (rate limiting)
CREATE TABLE IF NOT EXISTS t_p79348767_tournament_site_buil.login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ip_address, username)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup 
ON t_p79348767_tournament_site_buil.login_attempts (ip_address, username, last_attempt);

-- Create index for cleanup of old records
CREATE INDEX IF NOT EXISTS idx_login_attempts_cleanup 
ON t_p79348767_tournament_site_buil.login_attempts (last_attempt);