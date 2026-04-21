-- Add parent_id for hierarchical relationships
ALTER TABLE public.identity_backlog 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.identity_backlog(id) ON DELETE SET NULL;

-- Add muscle_test_stars for priority rating (0-5)
ALTER TABLE public.identity_backlog 
ADD COLUMN IF NOT EXISTS muscle_test_stars INTEGER DEFAULT 0 CHECK (muscle_test_stars >= 0 AND muscle_test_stars <= 5);

-- Add index for performance on hierarchical queries
CREATE INDEX IF NOT EXISTS idx_identity_backlog_parent_id ON public.identity_backlog(parent_id);