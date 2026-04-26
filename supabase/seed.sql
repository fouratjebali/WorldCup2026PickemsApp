-- FIFA World Cup 2026 seed data.
-- Updated with the official draw, confirmed play-off winners, and published fixture pairings.
-- kickoff_at stays null for now because this starter schema does not store venue/time-zone metadata.

insert into matches (stage, group_name, match_number, home_team, away_team, kickoff_at, status) values
  -- Group A
  ('Group stage', 'Group A', 1, 'Mexico', 'South Africa', null, 'scheduled'),
  ('Group stage', 'Group A', 2, 'Korea Republic', 'Czechia', null, 'scheduled'),
  ('Group stage', 'Group A', 25, 'Czechia', 'South Africa', null, 'scheduled'),
  ('Group stage', 'Group A', 28, 'Mexico', 'Korea Republic', null, 'scheduled'),
  ('Group stage', 'Group A', 53, 'Czechia', 'Mexico', null, 'scheduled'),
  ('Group stage', 'Group A', 54, 'South Africa', 'Korea Republic', null, 'scheduled'),

  -- Group B
  ('Group stage', 'Group B', 3, 'Canada', 'Bosnia and Herzegovina', null, 'scheduled'),
  ('Group stage', 'Group B', 8, 'Qatar', 'Switzerland', null, 'scheduled'),
  ('Group stage', 'Group B', 26, 'Switzerland', 'Bosnia and Herzegovina', null, 'scheduled'),
  ('Group stage', 'Group B', 27, 'Canada', 'Qatar', null, 'scheduled'),
  ('Group stage', 'Group B', 51, 'Switzerland', 'Canada', null, 'scheduled'),
  ('Group stage', 'Group B', 52, 'Bosnia and Herzegovina', 'Qatar', null, 'scheduled'),

  -- Group C
  ('Group stage', 'Group C', 5, 'Haiti', 'Scotland', null, 'scheduled'),
  ('Group stage', 'Group C', 7, 'Brazil', 'Morocco', null, 'scheduled'),
  ('Group stage', 'Group C', 29, 'Brazil', 'Haiti', null, 'scheduled'),
  ('Group stage', 'Group C', 30, 'Scotland', 'Morocco', null, 'scheduled'),
  ('Group stage', 'Group C', 49, 'Scotland', 'Brazil', null, 'scheduled'),
  ('Group stage', 'Group C', 50, 'Morocco', 'Haiti', null, 'scheduled'),

  -- Group D
  ('Group stage', 'Group D', 4, 'USA', 'Paraguay', null, 'scheduled'),
  ('Group stage', 'Group D', 6, 'Australia', 'Türkiye', null, 'scheduled'),
  ('Group stage', 'Group D', 31, 'Türkiye', 'Paraguay', null, 'scheduled'),
  ('Group stage', 'Group D', 32, 'USA', 'Australia', null, 'scheduled'),
  ('Group stage', 'Group D', 59, 'Türkiye', 'USA', null, 'scheduled'),
  ('Group stage', 'Group D', 60, 'Paraguay', 'Australia', null, 'scheduled'),

  -- Group E
  ('Group stage', 'Group E', 9, 'Côte d''Ivoire', 'Ecuador', null, 'scheduled'),
  ('Group stage', 'Group E', 10, 'Germany', 'Curaçao', null, 'scheduled'),
  ('Group stage', 'Group E', 33, 'Germany', 'Côte d''Ivoire', null, 'scheduled'),
  ('Group stage', 'Group E', 34, 'Ecuador', 'Curaçao', null, 'scheduled'),
  ('Group stage', 'Group E', 55, 'Curaçao', 'Côte d''Ivoire', null, 'scheduled'),
  ('Group stage', 'Group E', 56, 'Ecuador', 'Germany', null, 'scheduled'),

  -- Group F
  ('Group stage', 'Group F', 11, 'Netherlands', 'Japan', null, 'scheduled'),
  ('Group stage', 'Group F', 12, 'Sweden', 'Tunisia', null, 'scheduled'),
  ('Group stage', 'Group F', 35, 'Netherlands', 'Sweden', null, 'scheduled'),
  ('Group stage', 'Group F', 36, 'Tunisia', 'Japan', null, 'scheduled'),
  ('Group stage', 'Group F', 57, 'Japan', 'Sweden', null, 'scheduled'),
  ('Group stage', 'Group F', 58, 'Tunisia', 'Netherlands', null, 'scheduled'),

  -- Group G
  ('Group stage', 'Group G', 15, 'IR Iran', 'New Zealand', null, 'scheduled'),
  ('Group stage', 'Group G', 16, 'Belgium', 'Egypt', null, 'scheduled'),
  ('Group stage', 'Group G', 39, 'Belgium', 'IR Iran', null, 'scheduled'),
  ('Group stage', 'Group G', 40, 'New Zealand', 'Egypt', null, 'scheduled'),
  ('Group stage', 'Group G', 63, 'Egypt', 'IR Iran', null, 'scheduled'),
  ('Group stage', 'Group G', 64, 'New Zealand', 'Belgium', null, 'scheduled'),

  -- Group H
  ('Group stage', 'Group H', 13, 'Saudi Arabia', 'Uruguay', null, 'scheduled'),
  ('Group stage', 'Group H', 14, 'Spain', 'Cabo Verde', null, 'scheduled'),
  ('Group stage', 'Group H', 37, 'Uruguay', 'Cabo Verde', null, 'scheduled'),
  ('Group stage', 'Group H', 38, 'Spain', 'Saudi Arabia', null, 'scheduled'),
  ('Group stage', 'Group H', 65, 'Cabo Verde', 'Saudi Arabia', null, 'scheduled'),
  ('Group stage', 'Group H', 66, 'Uruguay', 'Spain', null, 'scheduled'),

  -- Group I
  ('Group stage', 'Group I', 17, 'France', 'Senegal', null, 'scheduled'),
  ('Group stage', 'Group I', 18, 'Iraq', 'Norway', null, 'scheduled'),
  ('Group stage', 'Group I', 41, 'Norway', 'Senegal', null, 'scheduled'),
  ('Group stage', 'Group I', 42, 'France', 'Iraq', null, 'scheduled'),
  ('Group stage', 'Group I', 61, 'Norway', 'France', null, 'scheduled'),
  ('Group stage', 'Group I', 62, 'Senegal', 'Iraq', null, 'scheduled'),

  -- Group J
  ('Group stage', 'Group J', 19, 'Argentina', 'Algeria', null, 'scheduled'),
  ('Group stage', 'Group J', 20, 'Austria', 'Jordan', null, 'scheduled'),
  ('Group stage', 'Group J', 43, 'Argentina', 'Austria', null, 'scheduled'),
  ('Group stage', 'Group J', 44, 'Jordan', 'Algeria', null, 'scheduled'),
  ('Group stage', 'Group J', 69, 'Algeria', 'Austria', null, 'scheduled'),
  ('Group stage', 'Group J', 70, 'Jordan', 'Argentina', null, 'scheduled'),

  -- Group K
  ('Group stage', 'Group K', 23, 'Portugal', 'Congo DR', null, 'scheduled'),
  ('Group stage', 'Group K', 24, 'Uzbekistan', 'Colombia', null, 'scheduled'),
  ('Group stage', 'Group K', 47, 'Portugal', 'Uzbekistan', null, 'scheduled'),
  ('Group stage', 'Group K', 48, 'Colombia', 'Congo DR', null, 'scheduled'),
  ('Group stage', 'Group K', 71, 'Colombia', 'Portugal', null, 'scheduled'),
  ('Group stage', 'Group K', 72, 'Congo DR', 'Uzbekistan', null, 'scheduled'),

  -- Group L
  ('Group stage', 'Group L', 21, 'Ghana', 'Panama', null, 'scheduled'),
  ('Group stage', 'Group L', 22, 'England', 'Croatia', null, 'scheduled'),
  ('Group stage', 'Group L', 45, 'England', 'Ghana', null, 'scheduled'),
  ('Group stage', 'Group L', 46, 'Panama', 'Croatia', null, 'scheduled'),
  ('Group stage', 'Group L', 67, 'Panama', 'England', null, 'scheduled'),
  ('Group stage', 'Group L', 68, 'Croatia', 'Ghana', null, 'scheduled'),

  -- Round of 32
  ('Round of 32', null, 73, 'Runner-up Group A', 'Runner-up Group B', null, 'scheduled'),
  ('Round of 32', null, 74, 'Winner Group E', 'Third Group A/B/C/D/F', null, 'scheduled'),
  ('Round of 32', null, 75, 'Winner Group F', 'Runner-up Group C', null, 'scheduled'),
  ('Round of 32', null, 76, 'Winner Group C', 'Runner-up Group F', null, 'scheduled'),
  ('Round of 32', null, 77, 'Winner Group I', 'Third Group C/D/F/G/H', null, 'scheduled'),
  ('Round of 32', null, 78, 'Runner-up Group E', 'Runner-up Group I', null, 'scheduled'),
  ('Round of 32', null, 79, 'Winner Group A', 'Third Group C/E/F/H/I', null, 'scheduled'),
  ('Round of 32', null, 80, 'Winner Group L', 'Third Group E/H/I/J/K', null, 'scheduled'),
  ('Round of 32', null, 81, 'Winner Group D', 'Third Group B/E/F/I/J', null, 'scheduled'),
  ('Round of 32', null, 82, 'Winner Group G', 'Third Group A/E/H/I/J', null, 'scheduled'),
  ('Round of 32', null, 83, 'Runner-up Group K', 'Runner-up Group L', null, 'scheduled'),
  ('Round of 32', null, 84, 'Winner Group H', 'Runner-up Group J', null, 'scheduled'),
  ('Round of 32', null, 85, 'Winner Group B', 'Third Group E/F/G/I/J', null, 'scheduled'),
  ('Round of 32', null, 86, 'Winner Group J', 'Runner-up Group H', null, 'scheduled'),
  ('Round of 32', null, 87, 'Winner Group K', 'Third Group D/E/I/J/L', null, 'scheduled'),
  ('Round of 32', null, 88, 'Runner-up Group D', 'Runner-up Group G', null, 'scheduled'),

  -- Round of 16
  ('Round of 16', null, 89, 'Winner Match 74', 'Winner Match 77', null, 'scheduled'),
  ('Round of 16', null, 90, 'Winner Match 73', 'Winner Match 75', null, 'scheduled'),
  ('Round of 16', null, 91, 'Winner Match 76', 'Winner Match 78', null, 'scheduled'),
  ('Round of 16', null, 92, 'Winner Match 79', 'Winner Match 80', null, 'scheduled'),
  ('Round of 16', null, 93, 'Winner Match 83', 'Winner Match 84', null, 'scheduled'),
  ('Round of 16', null, 94, 'Winner Match 81', 'Winner Match 82', null, 'scheduled'),
  ('Round of 16', null, 95, 'Winner Match 86', 'Winner Match 88', null, 'scheduled'),
  ('Round of 16', null, 96, 'Winner Match 85', 'Winner Match 87', null, 'scheduled'),

  -- Quarter-finals
  ('Quarter-finals', null, 97, 'Winner Match 89', 'Winner Match 90', null, 'scheduled'),
  ('Quarter-finals', null, 98, 'Winner Match 93', 'Winner Match 94', null, 'scheduled'),
  ('Quarter-finals', null, 99, 'Winner Match 91', 'Winner Match 92', null, 'scheduled'),
  ('Quarter-finals', null, 100, 'Winner Match 95', 'Winner Match 96', null, 'scheduled'),

  -- Semi-finals, third-place match, final
  ('Semi-finals', null, 101, 'Winner Match 97', 'Winner Match 98', null, 'scheduled'),
  ('Semi-finals', null, 102, 'Winner Match 99', 'Winner Match 100', null, 'scheduled'),
  ('Third-place match', null, 103, 'Loser Match 101', 'Loser Match 102', null, 'scheduled'),
  ('Final', null, 104, 'Winner Match 101', 'Winner Match 102', null, 'scheduled')
on conflict (match_number) do update set
  stage = excluded.stage,
  group_name = excluded.group_name,
  home_team = excluded.home_team,
  away_team = excluded.away_team,
  kickoff_at = excluded.kickoff_at,
  status = excluded.status;
