-- Add stats columns to users table for tournament tracking
ALTER TABLE t_p79348767_tournament_site_buil.users
ADD COLUMN tournaments INTEGER NOT NULL DEFAULT 0,
ADD COLUMN wins INTEGER NOT NULL DEFAULT 0,
ADD COLUMN losses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN draws INTEGER NOT NULL DEFAULT 0;