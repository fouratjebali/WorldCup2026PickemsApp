# World Cup 2026 Pickems

A simple Angular + Supabase starter for a World Cup 2026 pickems web app. Players choose a nickname and nationality,
predict match scores, create rooms for friends, and compete on room or global leaderboards.

## Features

- Anonymous local player identity with no password or classic auth.
- Onboarding with nickname and nationality.
- Group stage through final pickems UI.
- Private room creation with short join codes.
- Room and global leaderboard pages backed by a cached leaderboard table.
- Supabase SQL schema, seed data, scoring functions, and setup notes.
- Static Angular app ready for Cloudflare Pages.

## Stack

- Angular 21 standalone components
- TypeScript
- Tailwind CSS 4
- Supabase JS client
- Supabase PostgreSQL
- Cloudflare Pages for frontend hosting

## Setup

```bash
npm install
npm start
```

Open the local URL printed by Angular, usually `http://localhost:4200`.

## Environment Variables

Angular compiles environment values at build time. Update these files with placeholders locally first, then your real
public Supabase values when ready:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Required values:

- `SUPABASE_URL` maps to `supabaseUrl`
- `SUPABASE_ANON_KEY` maps to `supabaseAnonKey`
- `APP_NAME` maps to `appName`
- `APP_ENV` maps to `appEnv`

`.env.example` documents the values, but Angular does not automatically load it without extra tooling.

Never expose the Supabase service role key in frontend code.

## Database Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Copy the project URL and anon key into the Angular environment files.

See `supabase/README_SUPABASE_SETUP.md` for scoring and cache refresh details.

## Scripts

```bash
npm start      # local dev server
npm run build  # production build
npm test       # unit tests
```

## No-Auth Mode Limitation

This app intentionally has no recoverable account system. A random device token is stored in localStorage and only its
SHA-256 hash is saved in Supabase. If a user clears localStorage or uses another browser/device, the app treats them as a
new player.

Because there is no real auth, the included Supabase policies are permissive for MVP development. For a serious public
launch, add Supabase Auth, stricter RLS, server-side validation, and rate limiting.

## Deployment

Recommended:

- Frontend: Cloudflare Pages
- Backend/database: Supabase

Alternatives:

- Frontend: Netlify or Vercel
- Backend/database: Supabase

See `DEPLOYMENT.md` for step-by-step instructions.

## Future Improvements

- Real World Cup 2026 fixture import once official data is finalized.
- Supabase Auth for account recovery.
- Secured admin flow for result updates.
- Scheduled leaderboard recalculation after finished matches.
- Better anti-abuse controls and write rate limiting.
- Pagination controls beyond the starter top-50 leaderboard limit.
