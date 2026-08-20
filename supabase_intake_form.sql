-- Functional Neuro Health Intake Form — new columns on `clients`
-- Run this in the Supabase SQL Editor.

-- Personal & Contact
ALTER TABLE clients ADD COLUMN IF NOT EXISTS home_address           text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS intake_submitted_at    timestamptz;

-- Emergency Contact
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;

-- Chief Complaint & Health History
ALTER TABLE clients ADD COLUMN IF NOT EXISTS change_one_thing        text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS never_been_same_since   text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS chief_complaint         text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS health_problem_severity text;          -- Mild / Moderate / Severe / Extreme
ALTER TABLE clients ADD COLUMN IF NOT EXISTS seen_medical_doctor     boolean;

-- Symptoms
ALTER TABLE clients ADD COLUMN IF NOT EXISTS symptoms_worse_stress   boolean;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS symptoms_worse_fatigue  boolean;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pain_movement           text;          -- Better / Worse / Both / Other
ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_stress_level    integer;       -- 1-10

-- Previous Therapies
ALTER TABLE clients ADD COLUMN IF NOT EXISTS therapies_used          jsonb;         -- multi-select array
ALTER TABLE clients ADD COLUMN IF NOT EXISTS therapies_other         text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS therapies_success       text;

-- Specific Illnesses
ALTER TABLE clients ADD COLUMN IF NOT EXISTS specific_illnesses      text;

-- COVID-19
ALTER TABLE clients ADD COLUMN IF NOT EXISTS covid_vaccinated        boolean;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS covid_shots             integer;

-- Allergies & Immunity
ALTER TABLE clients ADD COLUMN IF NOT EXISTS allergies_asthma        text;

-- Energy
ALTER TABLE clients ADD COLUMN IF NOT EXISTS energy_worse_time       text;          -- Morning / Afternoon / Unsure / N/A

-- Family History
ALTER TABLE clients ADD COLUMN IF NOT EXISTS family_medical_history  jsonb;         -- multi-select

-- Lifestyle
ALTER TABLE clients ADD COLUMN IF NOT EXISTS alcohol_frequency       text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sleep_schedule          text;          -- bed time & wake time
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sleep_quality_details   jsonb;         -- multi-select

-- Concussion
ALTER TABLE clients ADD COLUMN IF NOT EXISTS concussion_history      boolean;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS concussion_details      text;

-- Birth
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthing_experience     text;          -- Natural / Cesarian / Induced / Premature / Blood loss

-- Emotional & Stress Profile
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avoided_emotion             text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS craved_emotion              text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stress_response             text;      -- Flight / Fight / Freeze / Immobilisation / Fawn / Stay calm
ALTER TABLE clients ADD COLUMN IF NOT EXISTS most_craved_human_need      text;      -- Certainty / Uncertainty / Significance / Connection / Growth / Contribution
ALTER TABLE clients ADD COLUMN IF NOT EXISTS startled_by_loud_noises     text;      -- Yes / No / Sometimes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emotional_regulation_time   text;

-- Open-ended
ALTER TABLE clients ADD COLUMN IF NOT EXISTS additional_notes            text;

-- Goals & Expectations
ALTER TABLE clients ADD COLUMN IF NOT EXISTS goal_working               text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS goal_12_sessions            text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS goal_safe_feeling           text;
