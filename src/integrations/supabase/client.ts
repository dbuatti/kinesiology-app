import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xebtjnvfkroiplyzftas.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlYnRqbnZma3JvaXBseXpmdGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDM2MjcsImV4cCI6MjA4NTA3OTYyN30.9qBYKHjW4nRK6E0In8ffSDLV7HJm925pr_4dSE_2IDs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);