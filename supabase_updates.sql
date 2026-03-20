-- 1. Update Clients Table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_practitioner BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS children TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS chatgpt_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS journal TEXT;

-- 2. Update Appointments Table with Assessment Fields
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS bolt_score INTEGER;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS heart_rate INTEGER;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS breath_rate INTEGER;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS coherence_score FLOAT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS sagittal_plane_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS frontal_plane_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS transverse_plane_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hydrated BOOLEAN;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hydration_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS emotion_mode TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS emotion_primary_selection TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS emotion_secondary_selection TEXT[];
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS emotion_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fakuda_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS sharpened_rhombergs_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS frontal_lobe_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS righting_reflex_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS luscher_color_1 TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS luscher_color_2 TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS harmonic_rocking_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS t1_reset_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS diaphragm_reset_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS vagus_nerve_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS gait_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lymphatic_suture_side TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lymphatic_priority_zone TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lymphatic_notes TEXT;