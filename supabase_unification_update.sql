-- 1. Update CLIENTS table with new clinical onboarding fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS medications_supplements TEXT,
ADD COLUMN IF NOT EXISTS current_stress_level INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS sleep_quality TEXT,
ADD COLUMN IF NOT EXISTS digestive_health TEXT,
ADD COLUMN IF NOT EXISTS medical_history TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- 2. Update APPOINTMENTS table with all new assessment fields
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS bolt_score INTEGER,
ADD COLUMN IF NOT EXISTS heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS breath_rate INTEGER,
ADD COLUMN IF NOT EXISTS coherence_score DECIMAL,
ADD COLUMN IF NOT EXISTS sagittal_plane_notes TEXT,
ADD COLUMN IF NOT EXISTS frontal_plane_notes TEXT,
ADD COLUMN IF NOT EXISTS transverse_plane_notes TEXT,
ADD COLUMN IF NOT EXISTS hydrated BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS hydration_notes TEXT,
ADD COLUMN IF NOT EXISTS emotion_mode TEXT,
ADD COLUMN IF NOT EXISTS emotion_primary_selection TEXT,
ADD COLUMN IF NOT EXISTS emotion_secondary_selection JSONB,
ADD COLUMN IF NOT EXISTS emotion_notes TEXT,
ADD COLUMN IF NOT EXISTS fakuda_notes TEXT,
ADD COLUMN IF NOT EXISTS sharpened_rhombergs_notes TEXT,
ADD COLUMN IF NOT EXISTS frontal_lobe_notes TEXT,
ADD COLUMN IF NOT EXISTS righting_reflex_notes TEXT,
ADD COLUMN IF NOT EXISTS luscher_color_1 TEXT,
ADD COLUMN IF NOT EXISTS luscher_color_2 TEXT,
ADD COLUMN IF NOT EXISTS harmonic_rocking_notes TEXT,
ADD COLUMN IF NOT EXISTS t1_reset_notes TEXT,
ADD COLUMN IF NOT EXISTS diaphragm_reset_notes TEXT,
ADD COLUMN IF NOT EXISTS vagus_nerve_notes TEXT,
ADD COLUMN IF NOT EXISTS gait_notes TEXT,
ADD COLUMN IF NOT EXISTS lymphatic_suture_side TEXT,
ADD COLUMN IF NOT EXISTS lymphatic_priority_zone TEXT,
ADD COLUMN IF NOT EXISTS lymphatic_notes TEXT;

-- 3. Create FEAR & CREATIVITY submissions table
CREATE TABLE IF NOT EXISTS fear_creativity_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Reflection',
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create INNER AWARENESS submissions table
CREATE TABLE IF NOT EXISTS inner_awareness_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Practice',
    trigger_context TEXT,
    form_data JSONB DEFAULT '{}'::jsonb,
    flow_completed TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create ANGER & FLOW submissions table
CREATE TABLE IF NOT EXISTS anger_flow_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Week 8 Reflection',
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create BRAIN REFLEX customizations table (for images)
CREATE TABLE IF NOT EXISTS brain_reflex_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reflex_id TEXT NOT NULL,
    image_url TEXT,
    secondary_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, reflex_id)
);

-- 7. Create MUSCLE customizations table (for images)
CREATE TABLE IF NOT EXISTS muscle_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    muscle_name TEXT NOT NULL,
    image_url TEXT,
    secondary_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, muscle_name)
);

-- 8. Enable RLS on new tables
ALTER TABLE fear_creativity_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inner_awareness_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anger_flow_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_reflex_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_customizations ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies (User can only see their own data)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own fear submissions') THEN
        CREATE POLICY "Users can manage their own fear submissions" ON fear_creativity_submissions FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own awareness submissions') THEN
        CREATE POLICY "Users can manage their own awareness submissions" ON inner_awareness_submissions FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own anger submissions') THEN
        CREATE POLICY "Users can manage their own anger submissions" ON anger_flow_submissions FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own reflex images') THEN
        CREATE POLICY "Users can manage their own reflex images" ON brain_reflex_customizations FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own muscle images') THEN
        CREATE POLICY "Users can manage their own muscle images" ON muscle_customizations FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;