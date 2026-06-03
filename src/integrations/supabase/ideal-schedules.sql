-- Create ideal_schedules table
CREATE TABLE public.ideal_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slots JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.ideal_schedules ENABLE ROW LEVEL SECURITY;

-- Grant Data API access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ideal_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ideal_schedules TO service_role;

-- Create policies for each operation
CREATE POLICY "ideal_schedules_select_policy" ON public.ideal_schedules
FOR SELECT TO authenticated USING (true);

CREATE POLICY "ideal_schedules_insert_policy" ON public.ideal_schedules
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ideal_schedules_update_policy" ON public.ideal_schedules
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "ideal_schedules_delete_policy" ON public.ideal_schedules
FOR DELETE TO authenticated USING (true);