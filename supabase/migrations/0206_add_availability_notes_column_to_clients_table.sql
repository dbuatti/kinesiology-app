-- Free-text availability notes per client, captured from client messages so the
-- practitioner and suggesting logic know each client's preferred scheduling windows.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS availability_notes TEXT;
