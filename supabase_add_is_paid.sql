-- Add is_paid column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Update existing records to false
UPDATE appointments SET is_paid = false WHERE is_paid IS NULL;