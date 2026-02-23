-- Create table for custom reflex images
CREATE TABLE IF NOT EXISTS public.brain_reflex_customizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reflex_id TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reflex_id)
);

-- Enable RLS
ALTER TABLE public.brain_reflex_customizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own reflex images" ON public.brain_reflex_customizations
FOR ALL TO authenticated USING (auth.uid() = user_id);