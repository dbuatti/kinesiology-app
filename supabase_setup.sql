-- Create table for muscle customizations
create table if not exists public.muscle_customizations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  muscle_name text not null,
  image_url text,
  secondary_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, muscle_name)
);

-- Enable RLS
alter table public.muscle_customizations enable row level security;

-- Policies
create policy "Users can manage their own muscle images"
  on public.muscle_customizations for all
  using (auth.uid() = user_id);

-- Note: Ensure you create a public storage bucket named 'muscle-images' in your Supabase dashboard.