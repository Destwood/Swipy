create table if not exists public.steam_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  steam_id text not null unique,
  persona_name text,
  avatar_url text,
  profile_url text,
  library_status text not null default 'pending',
  wishlist_status text not null default 'pending',
  linked_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create table if not exists public.steam_library (
  user_id uuid not null references auth.users (id) on delete cascade,
  app_id text not null,
  playtime_minutes integer not null default 0,
  synced_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

create table if not exists public.steam_wishlist (
  user_id uuid not null references auth.users (id) on delete cascade,
  app_id text not null,
  added_at timestamptz,
  synced_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

alter table public.steam_links enable row level security;
alter table public.steam_library enable row level security;
alter table public.steam_wishlist enable row level security;

drop policy if exists "steam_links_own" on public.steam_links;
create policy "steam_links_own" on public.steam_links
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "steam_library_own" on public.steam_library;
create policy "steam_library_own" on public.steam_library
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "steam_wishlist_own" on public.steam_wishlist;
create policy "steam_wishlist_own" on public.steam_wishlist
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
