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

-- Create policies for the table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own reflex images') THEN
        CREATE POLICY "Users can manage their own reflex images" ON public.brain_reflex_customizations
        FOR ALL TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;

-- Attempt to create the storage bucket via SQL (requires appropriate permissions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reflex-images', 'reflex-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'reflex-images');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reflex-images');
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'reflex-images' AND (storage.foldername(name))[1] = auth.uid()::text);