-- This trigger will automatically call your Edge Function whenever a new client is added.

-- 1. Create the function that calls the Edge Function
create or replace function public.sync_client_to_mailchimp()
returns trigger
language plpgsql
security definer
as $$
begin
  -- This sends the new client data to your Edge Function
  perform
    net.http_post(
      url := 'https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/sync-to-mailchimp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('record', row_to_json(new))
    );
  return new;
end;
$$;

-- 2. Attach the trigger to the clients table
drop trigger if exists on_client_created_sync on public.clients;
create trigger on_client_created_sync
  after insert on public.clients
  for each row
  execute function public.sync_client_to_mailchimp();