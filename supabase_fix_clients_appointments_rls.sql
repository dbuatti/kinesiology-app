-- Enable RLS (safe to run even if already enabled)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage their own appointments" ON public.appointments;

-- Clients: users can only see/manage their own clients
CREATE POLICY "Users can manage their own clients" ON public.clients
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Appointments: users can only see/manage their own appointments
CREATE POLICY "Users can manage their own appointments" ON public.appointments
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
