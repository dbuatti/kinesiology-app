CREATE TABLE public.cranial_nerve_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nerve_id TEXT NOT NULL,
  is_inhibited BOOLEAN DEFAULT false,
  is_stimulated BOOLEAN DEFAULT false,
  is_priority BOOLEAN DEFAULT false,
  is_primary_priority BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cranial_nerve_tests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own cranial nerve tests"
ON public.cranial_nerve_tests
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate entries for the same nerve in an appointment
ALTER TABLE public.cranial_nerve_tests ADD CONSTRAINT unique_appointment_nerve UNIQUE (appointment_id, nerve_id);