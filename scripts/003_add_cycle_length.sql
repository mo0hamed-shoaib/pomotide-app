-- Add cycle_length column to user_settings
-- 002_add_cycle_length.sql

ALTER TABLE IF EXISTS user_settings
ADD COLUMN IF NOT EXISTS cycle_length integer DEFAULT 4;

-- Optional: backfill existing rows with default 4 if null
UPDATE user_settings
SET cycle_length = 4
WHERE cycle_length IS NULL;