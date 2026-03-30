-- Create the table for Week 8 reflections
CREATE TABLE IF NOT EXISTS public.anger_flow_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Week 8 Reflection',
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.anger_flow_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only see and manage their own data
CREATE POLICY "Users can view their own anger flow submissions" 
ON public.anger_flow_submissions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anger flow submissions" 
ON public.anger_flow_submissions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anger flow submissions" 
ON public.anger_flow_submissions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anger flow submissions" 
ON public.anger_flow_submissions FOR DELETE 
USING (auth.uid() = user_id);

-- Add the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_anger_flow_submissions_updated_at
    BEFORE UPDATE ON public.anger_flow_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();