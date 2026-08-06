-- Signed-in Google users use role `authenticated`; 001 only allowed `anon`.
-- Run in Supabase → SQL Editor (this file does nothing until executed there).

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.sessions to anon, authenticated;
grant select, insert, update, delete on table public.session_members to anon, authenticated;
grant select, insert, update, delete on table public.votes to anon, authenticated;

drop policy if exists "sessions_anon_all" on public.sessions;
drop policy if exists "sessions_authenticated_all" on public.sessions;
drop policy if exists "sessions_all" on public.sessions;

drop policy if exists "session_members_anon_all" on public.session_members;
drop policy if exists "session_members_authenticated_all" on public.session_members;
drop policy if exists "session_members_all" on public.session_members;

drop policy if exists "votes_anon_all" on public.votes;
drop policy if exists "votes_authenticated_all" on public.votes;
drop policy if exists "votes_all" on public.votes;

create policy "sessions_all"
  on public.sessions for all to anon, authenticated
  using (true) with check (true);

create policy "session_members_all"
  on public.session_members for all to anon, authenticated
  using (true) with check (true);

create policy "votes_all"
  on public.votes for all to anon, authenticated
  using (true) with check (true);
