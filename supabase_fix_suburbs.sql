-- Fix the suburbs column type to prevent JSON syntax errors
-- This converts it from jsonb (if it was set that way) to a text array
ALTER TABLE clients 
ALTER COLUMN suburbs SET DATA TYPE text[] 
USING CASE 
    WHEN suburbs IS NULL THEN '{}'::text[]
    ELSE ARRAY[suburbs::text] 
END;

-- Ensure it defaults to an empty array so the app doesn't crash on nulls
ALTER TABLE clients ALTER COLUMN suburbs SET DEFAULT '{}'::text[];