# Supabase Setup

This starter uses Supabase PostgreSQL directly from a static Angular app with the public anon key.

## Steps

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Copy the project URL and public anon key into:
   - `src/environments/environment.ts`
   - `src/environments/environment.prod.ts`

Never put the Supabase service role key in Angular code.

## No-Auth Limitation

Players are anonymous. The browser stores a random local device token, and the app stores only a SHA-256 hash in
`players.device_token_hash`. If the user clears localStorage or switches browser/device, they cannot recover that player
without adding real authentication.

## Rate Limiting and Abuse

Because there is no real auth, the starter uses permissive anon database policies. For a public production launch, consider:

- Supabase Auth magic links or social login.
- Secured Edge Functions for writes that need validation.
- Cloudflare rate limiting in front of the static app.
- Stricter RLS policies once users have authenticated identities.

## Updating Scores

After a match finishes:

1. Update the row in `matches` with `home_score`, `away_score`, `winner_team`, and `status = 'finished'`.
2. Run `select calculate_points_for_match('<match-id>');`.
3. Run `select recalculate_global_leaderboard();`.
4. Run `select recalculate_room_leaderboard('<room-id>');` for active rooms.

For this simple MVP, room recalculation is manual. A production app can automate it with a secured job or Edge Function.
