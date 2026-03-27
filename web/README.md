# ElderCare Companion — Next.js

From the **repository root** you can run `npm install` and `npm run dev` (workspace); this package is **`eldercare-web`**.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run sync-public` | Copy `../silene-clone` → `public/`, rename `_next` → `mirror-next`, rewrite asset paths |
| `npm run dev` | `predev` runs sync, then Next dev server on port 3000 |
| `npm run build` | `prebuild` runs sync, then production build |

## Environment

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_APP_URL` — base URL for email redirects (e.g. `http://localhost:3000` locally, your production URL in deploy). Used by sign-up and password-reset links.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required for sign-in and data (RLS expects a user id when saving)

### Local Supabase (CLI + Docker)

From the **repository root** (not `web/`):

1. Install [Docker Desktop](https://docs.docker.com/desktop/) and keep it running.
2. **Log in to Supabase** (opens the browser): `npm run sb:login`
3. Start the local stack: `npm run sb:start` (first run downloads images).
4. Apply migrations and seed: `npm run sb:reset`
5. Print API URL and keys for `.env.local`: `npm run sb:env`  
   Paste the lines into `web/.env.local` (or copy from `npm run sb:status`). Local API is usually `http://127.0.0.1:54321`.
6. Run the app: `npm run dev` from the repo root.

`supabase/config.toml` already allows `http://127.0.0.1:3000/auth/callback` and `http://localhost:3000/auth/callback` for PKCE flows.

**Hosted project instead:** after `npm run sb:login`, run `npm run sb:link`, choose your project, then `npx supabase db push` to apply `supabase/migrations/` to the cloud database. Add the project’s **Project URL** and **anon key** from the Supabase dashboard to `web/.env.local`, and add your production `/auth/callback` URL under Authentication → URL configuration.

### Authentication

Routes: **`/get-started`** (entry from the landing **Get Started** button — links to sign-in and sign-up with `next=/app`), **`/auth/login`**, **`/auth/signup`**, **`/auth/forgot-password`**, **`/auth/update-password`**, **`/auth/callback`** (OAuth/email confirmation/password recovery — do not link directly).

The **`/app/**`** area requires a signed-in user when Supabase env vars are set; otherwise you can still open `/app` but data APIs will not persist. Configure **`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** in `web/.env.local` yourself (Supabase dashboard).

In the **Supabase dashboard** → Authentication → URL configuration, add to **Redirect URLs** (adjust host as needed):

- `http://localhost:3000/auth/callback`
- `https://<your-production-domain>/auth/callback`

Set **Site URL** to the same origin as `NEXT_PUBLIC_APP_URL` for your environment.
- `GEMINI_API_KEY` — optional; AI insights and clinic summary use **Gemini** when set (preferred). Optional `GEMINI_MODEL` (default `gemini-2.0-flash`).
- `ANTHROPIC_API_KEY` — optional; used if `GEMINI_API_KEY` is unset; demo string if neither is set
- `ELEVENLABS_API_KEY` — optional; enables **Listen** (TTS via `/api/voice/tts`) and **Record & transcribe** (STT via `/api/voice/transcribe`) on check-in. Optional: `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_STT_MODEL_ID` (see `.env.example`). Per-user read-aloud voice and speech language: **`/app/settings`** (requires Supabase migration `20250328120000_voice_preferences.sql`).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Static Silene landing (`public/index.html`) in an iframe |
| `/get-started` | Choose sign in or sign up (then `/app`) |
| `/auth/login`, `/auth/signup`, … | Sign in, register, password reset |
| `/app` | Dashboard (requires session when Supabase is configured) |
| `/app/check-in` | Daily check-in (Web Speech API where supported) |
| `/app/medications` | Medications + adherence |
| `/app/appointments` | Upcoming visits |
| `/app/summary` | AI clinic summary + PDF download |
| `/app/family` | Link a carer by user UUID |
| `/app/settings` | Voice & language (TTS voice, BCP 47 speech language) |

**Voice API routes (server-only key):** `GET /api/voice/status`, `GET /api/voice/voices`, `POST /api/voice/tts`, `POST /api/voice/transcribe`.

## Supabase

SQL migrations live at the **repo root**: `../supabase/migrations/` (or `supabase/migrations/` from the repository root). Apply them with the CLI (`npm run sb:reset` locally) or paste into the SQL editor for a hosted project. Saving data uses Supabase with row-level security (per-user rows).

## Deploy (e.g. Vercel)

Set the **root directory** to **`web`** (or use the repo root with npm workspaces and `npm run build` from root). Configure env vars. `prebuild` syncs the static landing into `public/`.

## Troubleshooting

**`Cannot find module './342.js'`, `TypeError: e[o] is not a function` in `webpack-runtime.js`, or other odd chunk / RSC errors** — usually a **stale or mixed `web/.next` cache** (dev server left running across big refactors, interrupted builds, or copying `.next`). Stop the dev server, run `rm -rf web/.next`, then `npm run dev` or `npm run build` from the repo root.
