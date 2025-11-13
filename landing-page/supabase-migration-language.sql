-- Migration: Add language column to games table
-- This column stores the programming language used for the game

ALTER TABLE games
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'python';

COMMENT ON COLUMN games.language IS 'Programming language used for the game (python, javascript, etc.)';

-- Create index for querying games by language
CREATE INDEX IF NOT EXISTS idx_games_language ON games(language);

-- Update existing games to explicitly set language as python
UPDATE games
SET language = 'python'
WHERE language IS NULL OR language = '';

