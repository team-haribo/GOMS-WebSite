-- GOMS-Web :: Supabase schema
-- Run this once in the Supabase SQL Editor after creating your project.
--
-- We store everything in a single KV table. The app reads/writes via the
-- service role key from the server, so RLS is left disabled on this table.
-- (Only server-side code uses SUPABASE_SERVICE_ROLE_KEY — never expose it
-- to the browser.)

create table if not exists public.kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Make sure RLS is explicitly disabled. The service role bypasses RLS anyway,
-- but keeping it disabled avoids confusion.
alter table public.kv disable row level security;
