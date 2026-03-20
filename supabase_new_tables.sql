-- 3. Image Customization Tables
CREATE TABLE IF NOT EXISTS ligament_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  image_index INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, category, image_index)
);

CREATE TABLE IF NOT EXISTS brain_reflex_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reflex_id TEXT NOT NULL,
  image_url TEXT,
  secondary_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, reflex_id)
);

CREATE TABLE IF NOT EXISTS muscle_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  muscle_name TEXT NOT NULL,
  image_url TEXT,
  secondary_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, muscle_name)
);

-- 4. Worksheet Tables
CREATE TABLE IF NOT EXISTS north_star_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  form_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS week3_worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  form_data JSONB NOT NULL DEFAULT '{}',
  signature_name TEXT,
  is_released BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fear_creativity_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inner_awareness_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  trigger_context TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  flow_completed TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE ligament_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_reflex_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE north_star_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE week3_worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fear_creativity_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inner_awareness_submissions ENABLE ROW LEVEL SECURITY;

-- Create basic "User can only see their own data" policies
DO $$ 
BEGIN
    EXECUTE 'CREATE POLICY "Users can manage their own ligament images" ON ligament_images FOR ALL USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own brain customizations" ON brain_reflex_customizations FOR ALL USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own muscle customizations" ON muscle_customizations FOR ALL USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own north star" ON north_star_intentions FOR ALL USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own week 3 worksheet" ON week3_worksheets FOR ALL USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own fear submissions" ON fear_creativity_submissions FOR ALL USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own awareness submissions" ON inner_awareness_submissions FOR ALL USING (auth.uid() = user_id)';
EXCEPTION WHEN OTHERS THEN 
    NULL; 
END $$;