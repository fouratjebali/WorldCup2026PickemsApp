-- World Cup 2026 Pickems starter schema.
-- This MVP intentionally uses no Supabase Auth. The frontend stores a random local device token and saves only its
-- SHA-256 hash in players.device_token_hash. If localStorage is cleared or the user changes browsers/devices, the
-- account cannot be recovered without adding real authentication.

create extension if not exists pgcrypto;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  device_token_hash text unique not null,
  nickname text not null check (char_length(nickname) between 2 and 30),
  nationality text not null check (char_length(nationality) between 1 and 56),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (char_length(code) between 4 and 8),
  name text not null check (char_length(name) between 3 and 48),
  created_by_player_id uuid not null references players(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (room_id, player_id)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null,
  group_name text null,
  match_number integer not null unique,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz null,
  home_score integer null check (home_score is null or home_score >= 0),
  away_score integer null check (away_score is null or away_score >= 0),
  winner_team text null,
  status text not null default 'scheduled' check (status in ('scheduled', 'locked', 'in_progress', 'finished'))
);

create table if not exists pickems (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  room_id uuid null references rooms(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  predicted_home_score integer null check (predicted_home_score is null or predicted_home_score >= 0),
  predicted_away_score integer null check (predicted_away_score is null or predicted_away_score >= 0),
  predicted_winner_team text null,
  points integer not null default 0,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (player_id, room_id, match_id)
);

create table if not exists group_standing_picks (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  room_id uuid null references rooms(id) on delete cascade,
  group_name text not null,
  team text not null,
  rank integer not null check (rank between 1 and 4),
  points integer not null default 0,
  wins integer not null default 0,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (player_id, room_id, group_name, team)
);

create table if not exists leaderboard_cache (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global', 'room')),
  room_id uuid null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  total_points integer not null default 0,
  correct_winners integer not null default 0,
  exact_scores integer not null default 0,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (scope, room_id, player_id)
);

create index if not exists idx_rooms_code on rooms (code);
create index if not exists idx_players_device_token_hash on players (device_token_hash);
create index if not exists idx_room_members_player on room_members (player_id, joined_at desc);
create index if not exists idx_room_members_room on room_members (room_id);
create index if not exists idx_matches_stage_number on matches (stage, match_number);
create index if not exists idx_pickems_player on pickems (player_id, room_id);
create index if not exists idx_pickems_room on pickems (room_id, player_id);
create index if not exists idx_pickems_match on pickems (match_id);
create index if not exists idx_group_standing_picks_player on group_standing_picks (player_id, room_id, group_name, rank);
create index if not exists idx_leaderboard_global on leaderboard_cache (scope, total_points desc, exact_scores desc)
  where scope = 'global';
create index if not exists idx_leaderboard_room on leaderboard_cache (room_id, total_points desc, exact_scores desc)
  where scope = 'room';

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists players_touch_updated_at on players;
create trigger players_touch_updated_at
before update on players
for each row execute function touch_updated_at();

drop trigger if exists pickems_touch_updated_at on pickems;
create trigger pickems_touch_updated_at
before update on pickems
for each row execute function touch_updated_at();

drop trigger if exists group_standing_picks_touch_updated_at on group_standing_picks;
create trigger group_standing_picks_touch_updated_at
before update on group_standing_picks
for each row execute function touch_updated_at();

-- Scoring for the current winner-only UI.
-- Correct picks are worth more as the tournament gets deeper:
-- Group stage: 1, Round of 32: 2, Round of 16: 3, Quarter-finals: 5,
-- Semi-finals: 8, Third-place match: 10, Final: 15.
-- Wrong winner: 0 points.
-- Score columns stay nullable so a future score-prediction mode can be added without changing the table shape.
create or replace function calculate_points_for_match(p_match_id uuid)
returns void
language plpgsql
as $$
declare
  actual_home integer;
  actual_away integer;
  actual_winner text;
  actual_stage text;
  stage_points integer;
begin
  select
    stage,
    home_score,
    away_score,
    case
      when home_score is null or away_score is null then null
      when home_score = away_score then 'Draw'
      when home_score > away_score then home_team
      else away_team
    end
  into actual_stage, actual_home, actual_away, actual_winner
  from matches
  where id = p_match_id;

  if actual_home is null or actual_away is null then
    return;
  end if;

  stage_points := case actual_stage
    when 'Group stage' then 1
    when 'Round of 32' then 2
    when 'Round of 16' then 3
    when 'Quarter-finals' then 5
    when 'Semi-finals' then 8
    when 'Third-place match' then 10
    when 'Final' then 15
    else 0
  end;

  update pickems
  set
    points = case
      when predicted_winner_team = actual_winner then stage_points
      else 0
    end,
    locked = true,
    updated_at = now()
  where match_id = p_match_id;
end;
$$;

create or replace function recalculate_global_leaderboard()
returns void
language plpgsql
as $$
begin
  delete from leaderboard_cache where scope = 'global';

  insert into leaderboard_cache (scope, room_id, player_id, total_points, correct_winners, exact_scores, updated_at)
  select
    'global',
    null,
    p.player_id,
    coalesce(sum(p.points), 0)::integer,
    count(*) filter (where p.points > 0)::integer,
    0,
    now()
  from pickems p
  where p.room_id is null
  group by p.player_id;
end;
$$;

create or replace function recalculate_room_leaderboard(p_room_id uuid)
returns void
language plpgsql
as $$
begin
  delete from leaderboard_cache where scope = 'room' and room_id = p_room_id;

  insert into leaderboard_cache (scope, room_id, player_id, total_points, correct_winners, exact_scores, updated_at)
  select
    'room',
    p_room_id,
    p.player_id,
    coalesce(sum(p.points), 0)::integer,
    count(*) filter (where p.points > 0)::integer,
    0,
    now()
  from pickems p
  where p.room_id = p_room_id
  group by p.player_id;
end;
$$;

alter table players enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table matches enable row level security;
alter table pickems enable row level security;
alter table group_standing_picks enable row level security;
alter table leaderboard_cache enable row level security;

-- Simple public anon policies for an MVP without auth. These are intentionally permissive so the static Angular app can
-- work with only the public anon key. Add Supabase Auth or secured Edge Functions before handling serious abuse risk.
drop policy if exists "public read players" on players;
create policy "public read players" on players for select to anon using (true);
drop policy if exists "public write players" on players;
create policy "public write players" on players for insert to anon with check (true);
drop policy if exists "public update players" on players;
create policy "public update players" on players for update to anon using (true) with check (true);

drop policy if exists "public read rooms" on rooms;
create policy "public read rooms" on rooms for select to anon using (true);
drop policy if exists "public write rooms" on rooms;
create policy "public write rooms" on rooms for insert to anon with check (true);

drop policy if exists "public read room_members" on room_members;
create policy "public read room_members" on room_members for select to anon using (true);
drop policy if exists "public write room_members" on room_members;
create policy "public write room_members" on room_members for insert to anon with check (true);
drop policy if exists "public update room_members" on room_members;
create policy "public update room_members" on room_members for update to anon using (true) with check (true);

drop policy if exists "public read matches" on matches;
create policy "public read matches" on matches for select to anon using (true);
drop policy if exists "public write matches" on matches;
create policy "public write matches" on matches for insert to anon with check (true);
drop policy if exists "public update matches" on matches;
create policy "public update matches" on matches for update to anon using (true) with check (true);

drop policy if exists "public read pickems" on pickems;
create policy "public read pickems" on pickems for select to anon using (true);
drop policy if exists "public write pickems" on pickems;
create policy "public write pickems" on pickems for insert to anon with check (true);
drop policy if exists "public update pickems" on pickems;
create policy "public update pickems" on pickems for update to anon using (true) with check (true);

drop policy if exists "public read group_standing_picks" on group_standing_picks;
create policy "public read group_standing_picks" on group_standing_picks for select to anon using (true);
drop policy if exists "public write group_standing_picks" on group_standing_picks;
create policy "public write group_standing_picks" on group_standing_picks for insert to anon with check (true);
drop policy if exists "public update group_standing_picks" on group_standing_picks;
create policy "public update group_standing_picks" on group_standing_picks for update to anon using (true) with check (true);

drop policy if exists "public read leaderboard_cache" on leaderboard_cache;
create policy "public read leaderboard_cache" on leaderboard_cache for select to anon using (true);
