# Pomotide

> A modern, minimal Pomodoro timer built with Next.js and Supabase — designed for focus, task management, and session tracking.

This repository contains the source for Pomotide, a clean and responsive Pomodoro app featuring task management, session history, and user authentication via Supabase.

## Features

- Pomodoro timer with configurable focus/break lengths
- Task creation and management
- Session tracking (pomodoro sessions saved to the database)
- User authentication (Supabase) — includes OAuth (Google)
- Settings per user saved in Supabase
- Clean UI components and accessibility-focused design

## Tech stack

- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- Recharts, date-fns, Radix UI and a few other UI libraries
- pnpm (lockfile present) — npm/yarn also supported

See `package.json` for the full dependency list.

## Quick start

Requirements:

- Node.js 18+ (recommended)
- A Supabase project (for Auth and a Postgres database)

1. Clone the repo

   git clone <repository-url>
   cd pomotide-app

2. Install dependencies

   Using pnpm (recommended because a `pnpm-lock.yaml` is present):

   pnpm install

   Or with npm:

   npm install

3. Environment variables

Create a `.env.local` file in the project root and add the following (replace the placeholders with values from your Supabase project):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Optional: used as the OAuth redirect during development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

Notes:

- The app uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- OAuth sign-in (Google) uses `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` if provided (see `lib/hooks/use-auth.tsx`).

4. Database setup

- There's an example SQL file at `scripts/001_create_tables.sql` with the table creation statements used by the app. You can run this from the Supabase SQL Editor or with psql against your database.

5. Run the dev server

```
pnpm dev
# or
npm run dev
```

The app will be available at http://localhost:3000.

## Available scripts

The following scripts are defined in `package.json`:

- `dev` — start Next.js in development mode
- `build` — build the production app (`next build`)
- `start` — run the built app (`next start`)
- `lint` — run the Next.js linting configuration

Run them with `pnpm` or `npm`, for example `pnpm build` or `npm run build`.

## Auth / OAuth notes

- The app uses Supabase Auth. You can enable OAuth providers (like Google) in your Supabase project's Authentication > Providers settings.
- Make sure your provider settings include the redirect URL used by the app (for local dev: `http://localhost:3000` or the value set in `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`).

## Project structure (high level)

- `app/` — Next.js App Routes + pages
- `components/` — UI components and small feature components (timer, tasks, etc.)
- `lib/` — utilities and hooks; `lib/supabase` contains Supabase client helpers
- `scripts/` — SQL migration/example scripts (e.g. `001_create_tables.sql`)
- `styles/` — Tailwind / global styles

## Contributing

Contributions are welcome. A few suggested ways to help:

- Open issues for bugs or feature requests
- Fork and create pull requests for small, focused changes
- Add or improve tests and type coverage

Please follow existing code style and keep PRs focused (one change per PR is easiest to review).

## Roadmap ideas

- User preferences sync and import/export
- More granular session statistics and charts
- Mobile improvements and PWA support
- Better onboarding/tutorial flows

## Acknowledgements

Built with a number of excellent open-source libraries including Next.js, Supabase, Tailwind CSS, Radix UI and Recharts.

## License

This repository does not include a license file. If you plan to publish this project, add a `LICENSE` (MIT, Apache-2.0, etc.) to make terms clear.

---

If you'd like, I can also:

- Add a small demo GIF or screenshots to the README (you can provide images or I can add placeholders),
- Create a basic `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`, or
- Wire up a GitHub Actions workflow for basic lint/build checks.

Tell me which of those you'd like next.
