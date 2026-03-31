-- 1. Ensure 'suburbs' is a text array, not a JSONB column
-- This prevents the "invalid input syntax for type json" error when passing strings or arrays
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'suburbs' 
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE clients 
        ALTER COLUMN suburbs TYPE text[] 
        USING ARRAY[suburbs::text];
    END IF;
END $$;

-- 2. Add a metadata column to appointments to safely store raw webhook payloads if needed
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Ensure RLS is bypassed for the service_role key (standard, but good to verify)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;