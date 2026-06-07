-- Add source session tracking columns for identity_backlog
ALTER TABLE public.identity_backlog
ADD COLUMN IF NOT EXISTS source_session_id UUID,
ADD COLUMN IF NOT EXISTS source_session_type TEXT;

CREATE INDEX IF NOT EXISTS idx_identity_backlog_source_session ON public.identity_backlog(source_session_id);
