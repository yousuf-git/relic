-- Relic initial schema. Every table is exposed through the Neon Data API,
-- so every table has RLS enabled and is scoped to auth.user_id().

create extension if not exists pgcrypto;

create or replace function public.current_user_id() returns uuid
language sql stable
as $$ select nullif(auth.user_id(), '')::uuid $$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Profiles ------------------------------------------------------------------
create table public.profiles (
  user_id        uuid primary key references neon_auth."user"(id) on delete cascade,
  display_name   text check (char_length(display_name) <= 60),
  timezone       text not null default 'UTC' check (char_length(timezone) <= 64),
  -- Only writable by the service role: plan drives the free-tier limits.
  plan           text not null default 'free' check (plan in ('free', 'premium')),
  notification_prefs jsonb not null default '{}'::jsonb,
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Memories (relics) ---------------------------------------------------------
create table public.memories (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default public.current_user_id()
                       references public.profiles(user_id) on delete cascade,
  title              text check (char_length(title) <= 120),
  body               text check (char_length(body) <= 10000),
  occurred_on        date not null,
  weight             smallint not null default 3 check (weight between 1 and 5),
  mood               text not null default 'honey'
                       check (mood in ('ember', 'honey', 'moss', 'tide', 'dusk', 'ash')),
  vessel             text not null default 'letter'
                       check (vessel in ('letter', 'plate', 'shell', 'map', 'locket', 'reel')),
  place_name         text check (char_length(place_name) <= 160),
  place_lat          double precision check (place_lat between -90 and 90),
  place_lng          double precision check (place_lng between -180 and 180),
  sealed_until       date,
  -- The keeper's local calendar day at creation; the free daily cap counts these.
  created_local_date date not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  unique (id, user_id)
);

create index memories_user_occurred_idx on public.memories (user_id, occurred_on desc) where deleted_at is null;
create index memories_user_created_day_idx on public.memories (user_id, created_local_date);
create index memories_user_month_day_idx on public.memories
  (user_id, extract(month from occurred_on), extract(day from occurred_on)) where deleted_at is null;

create or replace function public.memories_before_insert() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan text;
  v_tz text;
  v_today date;
  v_count int;
begin
  select plan, timezone into v_plan, v_tz from public.profiles where user_id = new.user_id;
  if not found then
    raise exception 'profile missing' using errcode = 'P0001', hint = 'profile_missing';
  end if;

  v_today := (now() at time zone v_tz)::date;
  new.created_local_date := v_today;

  if v_plan = 'free' then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
    select count(*) into v_count
      from public.memories
     where user_id = new.user_id and created_local_date = v_today;
    if v_count >= 5 then
      raise exception 'daily relic limit reached' using errcode = 'P0001', hint = 'daily_limit';
    end if;
  end if;
  return new;
end $$;

create trigger memories_before_insert before insert on public.memories
  for each row execute function public.memories_before_insert();

create trigger memories_touch before update on public.memories
  for each row execute function public.touch_updated_at();

-- People & constellation links ---------------------------------------------
create table public.people (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default public.current_user_id()
               references public.profiles(user_id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index people_user_name_uq on public.people (user_id, lower(name));

create table public.memory_people (
  memory_id uuid not null,
  person_id uuid not null,
  user_id   uuid not null default public.current_user_id(),
  primary key (memory_id, person_id),
  -- Composite keys make cross-user links impossible even if a policy were wrong.
  foreign key (memory_id, user_id) references public.memories(id, user_id) on delete cascade,
  foreign key (person_id, user_id) references public.people(id, user_id) on delete cascade
);
create index memory_people_person_idx on public.memory_people (user_id, person_id);

-- Media (photos ≤ 5 per memory, one voice ≤ 60 s) ---------------------------
-- Rows are written only by the media function (owner role), never by clients.
create table public.media (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  memory_id    uuid not null,
  kind         text not null check (kind in ('photo', 'voice')),
  object_key   text not null unique,
  content_type text not null check (content_type in ('image/webp', 'image/jpeg', 'audio/mp4', 'audio/m4a', 'audio/aac')),
  size_bytes   bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  duration_ms  integer check (duration_ms is null or duration_ms between 1 and 60000),
  width        integer,
  height       integer,
  position     smallint not null default 0,
  status       text not null default 'pending' check (status in ('pending', 'ready')),
  created_at   timestamptz not null default now(),
  foreign key (memory_id, user_id) references public.memories(id, user_id) on delete cascade,
  check (kind <> 'voice' or duration_ms is not null)
);
create index media_memory_idx on public.media (memory_id, position);
create index media_user_idx on public.media (user_id);

create or replace function public.media_before_insert() returns trigger
language plpgsql
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.memory_id::text, 1));
  select count(*) into v_count from public.media where memory_id = new.memory_id and kind = new.kind;
  if new.kind = 'photo' and v_count >= 5 then
    raise exception 'photo limit reached' using errcode = 'P0001', hint = 'photo_limit';
  end if;
  if new.kind = 'voice' and v_count >= 1 then
    raise exception 'voice limit reached' using errcode = 'P0001', hint = 'voice_limit';
  end if;
  return new;
end $$;

create trigger media_before_insert before insert on public.media
  for each row execute function public.media_before_insert();

-- Video links (no video bytes are stored) -----------------------------------
create table public.links (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default public.current_user_id(),
  memory_id  uuid not null,
  url        text not null check (url ~* '^https://' and char_length(url) <= 2048),
  label      text check (char_length(label) <= 120),
  created_at timestamptz not null default now(),
  foreign key (memory_id, user_id) references public.memories(id, user_id) on delete cascade
);
create index links_memory_idx on public.links (memory_id);

-- Premium waitlist ------------------------------------------------------------
create table public.waitlist (
  user_id    uuid primary key default public.current_user_id()
               references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Usage (quota + daily count) for the signed-in keeper -----------------------
create or replace function public.vault_usage()
returns table (plan text, bytes_used bigint, bytes_limit bigint, relics_today int, relics_today_limit int)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select p.plan,
         coalesce((select sum(m.size_bytes) from public.media m where m.user_id = p.user_id), 0)::bigint,
         case when p.plan = 'free' then 524288000::bigint else null end,
         (select count(*) from public.memories r
           where r.user_id = p.user_id
             and r.created_local_date = (now() at time zone p.timezone)::date)::int,
         case when p.plan = 'free' then 5 else null end
    from public.profiles p
   where p.user_id = public.current_user_id()
$$;

-- Row level security ----------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.memories      enable row level security;
alter table public.people        enable row level security;
alter table public.memory_people enable row level security;
alter table public.media         enable row level security;
alter table public.links         enable row level security;
alter table public.waitlist      enable row level security;

create policy profiles_own on public.profiles for all to authenticated
  using (user_id = (select public.current_user_id()))
  with check (user_id = (select public.current_user_id()));

create policy memories_own on public.memories for all to authenticated
  using (user_id = (select public.current_user_id()))
  with check (user_id = (select public.current_user_id()));

create policy people_own on public.people for all to authenticated
  using (user_id = (select public.current_user_id()))
  with check (user_id = (select public.current_user_id()));

create policy memory_people_own on public.memory_people for all to authenticated
  using (user_id = (select public.current_user_id()))
  with check (user_id = (select public.current_user_id()));

create policy media_own_read on public.media for select to authenticated
  using (user_id = (select public.current_user_id()));

create policy links_own on public.links for all to authenticated
  using (user_id = (select public.current_user_id()))
  with check (user_id = (select public.current_user_id()));

create policy waitlist_own on public.waitlist for all to authenticated
  using (user_id = (select public.current_user_id()))
  with check (user_id = (select public.current_user_id()));

-- Grants: nothing for anonymous; column-limited writes where it matters --------
revoke all on all tables in schema public from anonymous, authenticated;
revoke all on function public.vault_usage() from public;

grant select, delete on public.profiles to authenticated;
grant insert (user_id, display_name, timezone, notification_prefs, onboarded_at) on public.profiles to authenticated;
grant update (display_name, timezone, notification_prefs, onboarded_at) on public.profiles to authenticated;

grant select, delete on public.memories to authenticated;
grant insert (id, title, body, occurred_on, weight, mood, vessel, place_name, place_lat, place_lng, sealed_until)
  on public.memories to authenticated;
grant update (title, body, occurred_on, weight, mood, vessel, place_name, place_lat, place_lng, sealed_until, deleted_at)
  on public.memories to authenticated;

grant select, insert, update, delete on public.people to authenticated;
grant select, insert, delete on public.memory_people to authenticated;
grant select on public.media to authenticated;
grant select, insert, delete on public.links to authenticated;
grant select, insert, delete on public.waitlist to authenticated;
grant execute on function public.vault_usage() to authenticated;
grant execute on function public.current_user_id() to authenticated;
