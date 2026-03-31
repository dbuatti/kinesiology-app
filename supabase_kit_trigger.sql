-- 1. Create the function that calls the Kit Edge Function
CREATE OR REPLACE FUNCTION public.sync_client_to_kit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/sync-to-kit',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$;

-- 2. Create the trigger on the clients table
DROP TRIGGER IF EXISTS on_client_created_kit ON public.clients;
CREATE TRIGGER on_client_created_kit
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_to_kit();

COMMENT ON FUNCTION public.sync_client_to_kit IS 'Automatically syncs new clients to Kit via Edge Function';