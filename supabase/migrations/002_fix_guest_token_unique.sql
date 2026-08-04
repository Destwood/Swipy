-- Fix: guest_token must be unique per session, not globally
-- (same browser can host/join multiple sessions over time)

alter table public.session_members
  drop constraint if exists session_members_guest_token_key;

drop index if exists session_members_guest_token_key;

create unique index if not exists session_members_session_id_guest_token_key
  on public.session_members (session_id, guest_token);
