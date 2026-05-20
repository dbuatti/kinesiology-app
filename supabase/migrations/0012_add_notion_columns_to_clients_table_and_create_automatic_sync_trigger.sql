-- Add notion columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notion_page_id TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notion_link TEXT;

-- Create or replace function to sync client to notion
CREATE OR REPLACE FUNCTION public.sync_client_to_notion()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/sync-to-notion',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('clientId', NEW.id)
    );
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_client_sync_notion ON public.clients;

-- Create trigger on clients table
CREATE TRIGGER on_client_sync_notion
  AFTER INSERT OR UPDATE OF 
    name, 
    email, 
    phone, 
    pronouns, 
    born, 
    occupation, 
    marital_status, 
    children, 
    emergency_contact_name, 
    emergency_contact_phone, 
    medications_supplements, 
    current_stress_level, 
    sleep_quality, 
    digestive_health, 
    medical_history, 
    referral_source
  ON public.clients
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_client_to_notion();
