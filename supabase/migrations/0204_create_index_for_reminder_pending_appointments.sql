CREATE INDEX IF NOT EXISTS idx_appointments_reminder_pending 
ON public.appointments (date) 
WHERE reminder_sent = false AND status IN ('Scheduled', 'Confirmed');