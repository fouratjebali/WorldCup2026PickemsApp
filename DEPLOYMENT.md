# Deployment Guide

## Development

1. Install dependencies:

```bash
npm install
```

2. Start Angular:

```bash
npm start
```

3. Create a Supabase project at `https://supabase.com`.

4. In Supabase SQL Editor, run:

```sql
-- paste and run supabase/schema.sql
-- paste and run supabase/seed.sql
```

5. Configure `src/environments/environment.ts`:

```ts
export const environment = {
  supabaseUrl: 'https://your-project-ref.supabase.co',
  supabaseAnonKey: 'your-public-anon-key',
  appName: 'World Cup 2026 Pickems',
  appEnv: 'development',
};
```

The anon key is public by design. Do not put the service role key in this app.

## Production

1. Create or reuse a Supabase hosted project.
2. Run `supabase/schema.sql` and `supabase/seed.sql`.
3. Copy the Supabase project URL and anon key.
4. Configure `src/environments/environment.prod.ts` with production values.
5. Push the repo to GitHub.
6. In Cloudflare Pages, connect the GitHub repo.
7. Use:

```bash
npm run build
```

8. Set the output directory to:

```text
dist/worldcup-pickems/browser
```

9. Deploy and test:

- Home loads.
- Onboarding saves a profile.
- Pickems show seeded matches.
- Room creation and joining work.
- Leaderboard pages load.

The `public/_redirects` file keeps Angular routes working on refresh.

## Environment Variables on Hosts

This starter uses Angular environment files, so values are compiled into the static bundle. If you prefer host-provided
environment variables later, add a small build-time replacement step or runtime config JSON file.

## Free Deployment Recommendation

- Frontend: Cloudflare Pages
- Backend/database: Supabase

Alternative frontend hosts:

- Netlify
- Vercel

Free tiers are good for development, MVPs, and moderate traffic. They are not guaranteed for unlimited viral traffic. If
the app becomes popular during the World Cup, plan to upgrade Supabase and add stronger caching, RLS, write validation,
and rate limiting.
