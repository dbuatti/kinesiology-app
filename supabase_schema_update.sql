-- 1. Weekly Focus Table
CREATE TABLE IF NOT EXISTS public.weekly_focus (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    items TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.weekly_focus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weekly focus" 
ON public.weekly_focus FOR ALL 
USING (auth.uid() = user_id);

-- 2. North Star Intentions Table
CREATE TABLE IF NOT EXISTS public.north_star_intentions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    form_data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.north_star_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own north star" 
ON public.north_star_intentions FOR ALL 
USING (auth.uid() = user_id);

-- 3. Fear & Creativity Submissions
CREATE TABLE IF NOT EXISTS public.fear_creativity_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    form_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fear_creativity_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own fear creativity submissions" 
ON public.fear_creativity_submissions FOR ALL 
USING (auth.uid() = user_id);

-- 4. Inner Awareness Submissions
CREATE TABLE IF NOT EXISTS public.inner_awareness_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    trigger_context TEXT,
    form_data JSONB DEFAULT '{}',
    flow_completed TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inner_awareness_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inner awareness submissions" 
ON public.inner_awareness_submissions FOR ALL 
USING (auth.uid() = user_id);

-- 5. Week 3 Worksheets (Curses/Generational)
CREATE TABLE IF NOT EXISTS public.week3_worksheets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    form_data JSONB DEFAULT '{}',
    signature_name TEXT,
    is_released BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.week3_worksheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own week 3 worksheets" 
ON public.week3_worksheets FOR ALL 
USING (auth.uid() = user_id);

-- 6. Brain Reflex Customizations (Images)
CREATE TABLE IF NOT EXISTS public.brain_reflex_customizations (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reflex_id TEXT,
    image_url TEXT,
    secondary_image_url TEXT,
    PRIMARY KEY (user_id, reflex_id)
);

ALTER TABLE public.brain_reflex_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reflex images" 
ON public.brain_reflex_customizations FOR ALL 
USING (auth.uid() = user_id);

-- 7. Muscle Customizations (Images)
CREATE TABLE IF NOT EXISTS public.muscle_customizations (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    muscle_name TEXT,
    image_url TEXT,
    secondary_image_url TEXT,
    PRIMARY KEY (user_id, muscle_name)
);

ALTER TABLE public.muscle_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own muscle images" 
ON public.muscle_customizations FOR ALL 
USING (auth.uid() = user_id);

-- 8. Ligament Images
CREATE TABLE IF NOT EXISTS public.ligament_images (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT,
    image_index INT,
    image_url TEXT,
    PRIMARY KEY (user_id, category, image_index)
);

ALTER TABLE public.ligament_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ligament images" 
ON public.ligament_images FOR ALL 
USING (auth.uid() = user_id);

-- 9. Ensure Appointments table has all clinical columns
DO $$ 
BEGIN 
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='bolt_score') THEN
        ALTER TABLE public.appointments ADD COLUMN bolt_score INT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='coherence_score') THEN
        ALTER TABLE public.appointments ADD COLUMN coherence_score FLOAT;
        ALTER TABLE public.appointments ADD COLUMN heart_rate INT;
        ALTER TABLE public.appointments ADD COLUMN breath_rate INT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='priority_pattern') THEN
        ALTER TABLE public.appointments ADD COLUMN priority_pattern TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='modes_balances') THEN
        ALTER TABLE public.appointments ADD COLUMN modes_balances TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='session_north_star') THEN
        ALTER TABLE public.appointments ADD COLUMN session_north_star TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='hydrated') THEN
        ALTER TABLE public.appointments ADD COLUMN hydrated BOOLEAN DEFAULT false;
    END IF;

    -- Add all other clinical fields
    ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS sagittal_plane_notes TEXT,
    ADD COLUMN IF NOT EXISTS frontal_plane_notes TEXT,
    ADD COLUMN IF NOT EXISTS transverse_plane_notes TEXT,
    ADD COLUMN IF NOT EXISTS emotion_mode TEXT,
    ADD COLUMN IF NOT EXISTS emotion_primary_selection TEXT,
    ADD COLUMN IF NOT EXISTS emotion_secondary_selection TEXT[],
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
END $$;