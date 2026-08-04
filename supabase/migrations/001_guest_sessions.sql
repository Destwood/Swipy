-- Swipy guest-session MVP (no Auth)
-- Run in Supabase → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  deck_id text not null,
  status text not null default 'lobby'
    check (status in ('lobby', 'swiping', 'finished')),
  match_rule text not null default 'all'
    check (match_rule in ('all', 'majority', 'half')),
  created_at timestamptz not null default now()
);

create table if not exists public.session_members (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  display_name text not null,
  guest_token text not null,
  is_host boolean not null default false,
  status text not null default 'waiting'
    check (status in ('waiting', 'ready', 'swiping', 'done')),
  created_at timestamptz not null default now(),
  unique (session_id, guest_token)
);

create index if not exists session_members_session_id_idx
  on public.session_members (session_id);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  member_id uuid not null references public.session_members (id) on delete cascade,
  game_id text not null,
  value text not null check (value in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique (session_id, member_id, game_id)
);

create index if not exists votes_session_id_idx on public.votes (session_id);

-- Guest MVP: anon client can read/write these tables.
-- Tighten later (Edge Functions / Auth). Not production-hardened.
alter table public.sessions enable row level security;
alter table public.session_members enable row level security;
alter table public.votes enable row level security;

create policy "sessions_anon_all"
  on public.sessions for all to anon using (true) with check (true);

create policy "session_members_anon_all"
  on public.session_members for all to anon using (true) with check (true);

create policy "votes_anon_all"
  on public.votes for all to anon using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.session_members;
alter publication supabase_realtime add table public.votes;
