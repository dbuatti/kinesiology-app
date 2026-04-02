-- Add is_paid column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;