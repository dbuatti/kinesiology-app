DROP TRIGGER IF EXISTS on_appointment_sync_notion ON public.appointments;

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
    medications_supplements,
    price_amount,
    is_paid,
    payment_received,
    payment_method
  ON public.appointments
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_appointment_to_notion();