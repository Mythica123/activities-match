-- Migration: Create activities table + storage bucket policies

-- Activities table
create table if not exists public.activities (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),

  -- Core fields
  title                text        not null,
  description          text        not null,
  category             text        not null,
  scheduled_at         timestamptz not null,
  location             text        not null,
  image_url            text,

  -- Participant info
  max_participants     int         not null check (max_participants >= 1),
  current_participants int         not null default 1,

  -- Creator
  creator_id           uuid        not null references public.users(id) on delete cascade,

  -- Optional filters set by the creator
  genders              text[],           -- e.g. ['Male','Female']
  age_min              int,
  age_max              int,
  distance_miles       numeric(6,2),

  -- Soft-delete / status
  is_cancelled         boolean     not null default false
);

-- Index for fast discovery queries
create index if not exists activities_scheduled_at_idx on public.activities (scheduled_at);
create index if not exists activities_creator_id_idx   on public.activities (creator_id);
create index if not exists activities_category_idx     on public.activities (category);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.activities enable row level security;

-- Anyone can read activities
create policy "Public read activities"
  on public.activities for select
  using (true);

-- Only the service role (used by the API) can insert/update/delete
-- (The API route uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Run this in the Supabase dashboard SQL editor OR via CLI.
-- The bucket must be created first (Dashboard > Storage > New bucket: "activities", public: true).
-- Then apply these policies:

-- Allow public read on activity images
create policy "Public read activity images"
  on storage.objects for select
  using ( bucket_id = 'activities' );

-- Allow service role to upload (the API handles uploads server-side)
create policy "Service role upload activity images"
  on storage.objects for insert
  with check ( bucket_id = 'activities' );