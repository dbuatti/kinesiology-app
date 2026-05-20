CREATE OR REPLACE FUNCTION public.sync_appointment_to_notion()
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
      body := jsonb_build_object('appointmentId', NEW.id)
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_appointment_created_notion ON public.appointments;
CREATE TRIGGER on_appointment_created_notion
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.sync_appointment_to_notion();