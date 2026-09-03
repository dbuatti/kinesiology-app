-- Allow anon/authenticated users to read appointments (for lesson-rig lookup)
-- This is a read-only policy: SELECT only, no INSERT/UPDATE/DELETE

CREATE POLICY "Allow read-only access to appointments"
ON public.appointments
FOR SELECT
TO anon, authenticated
USING (true);
