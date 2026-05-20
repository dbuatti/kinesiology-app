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

-- Drop the old insert-only trigger
DROP TRIGGER IF EXISTS on_appointment_created_notion ON public.appointments;

-- Create a new trigger that fires on INSERT and on UPDATE of any clinical/onboarding fields
CREATE TRIGGER on_appointment_sync_notion
  AFTER INSERT OR UPDATE OF 
    name, 
    date, 
    goal, 
    tag, 
    notes, 
    modes_balances, 
    acupoints, 
    current_stress_level, 
    sleep_quality, 
    digestive_health, 
    medications_supplements
  ON public.appointments
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_appointment_to_notion();