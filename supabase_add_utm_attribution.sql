-- Attribution (UTM + click IDs) captured from the public landing/intake flow.
-- Stored on the client row so we can measure which campaigns produce bookings.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_source        text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_medium        text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_campaign      text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_term          text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_content       text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gclid            text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fbclid           text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_referrer      text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_landing_path  text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_captured_at   timestamptz;