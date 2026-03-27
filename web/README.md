# ElderCare Companion — Next.js app

This package (**`eldercare-web`**) is the main product UI and API. Run **`npm install`** and **`npm run dev`** from the **repository root** (npm workspaces).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run sync-public` | Copy `../silene-clone` → `public/`, rename `_next` → `mirror-next`, rewrite asset paths |
| `npm run dev` | `predev` runs sync, then Next dev server on port 3000 |
| `npm run build` | `prebuild` runs sync, then production build |

## Environment

Copy **`.env.example`** to **`.env.local`**:

- **`DEMO_AUTO_SEED`** — Optional; `1` or `true` seeds sample dashboard data when the user has no logs/meds (demos only).
- **`NEXT_PUBLIC_APP_URL`** — Base URL for auth email links (local dev or production origin).
- **`NEXT_PUBLIC_SUPABASE_URL`** / **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — Required for sign-in and persisted data (RLS per user).

### Local Supabase (CLI + Docker)

From the **repository root**:

1. Install Docker Desktop and keep it running.
2. `npm run sb:login`
3. `npm run sb:start`
4. `npm run sb:reset` (migrations + seed)
5. `npm run sb:env` → paste into `web/.env.local`
6. `npm run dev` from repo root

`supabase/config.toml` allows local auth callbacks on port 3000.

**Hosted Supabase:** `npm run sb:link`, then `npx supabase db push`, then add project URL + anon key to `web/.env.local` and configure redirect URLs in the dashboard.

### Authentication

Routes: **`/get-started`**, **`/auth/login`**, **`/auth/signup`**, **`/auth/forgot-password`**, **`/auth/update-password`**, **`/auth/callback`** (do not bookmark the callback URL).

### AI and voice (optional)

- **`GEMINI_API_KEY`** — Primary AI (insights, clinic summary, dashboard chat). Optional **`GEMINI_MODEL`** to pin a model.
- **`ANTHROPIC_API_KEY`** — Fallback when Gemini fails or is unset.
- **`ELEVENLABS_API_KEY`** — TTS (`/api/voice/tts`) and STT (`/api/voice/transcribe`) where used. Voice ID and model overrides: see `.env.example`. Per-user voice/language: **`/app/settings`** (requires voice-preferences migration).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Bundled static landing (iframe) |
| `/get-started` | Sign in or sign up |
| `/auth/*` | Auth flows |
| `/app` | Dashboard |
| `/app/check-in` | Daily check-in (speech where supported) |
| `/app/medications` | Medications and adherence |
| `/app/appointments` | Appointments |
| `/app/summary` | AI clinic summary + PDF |
| `/app/settings` | Voice and language |

**Voice APIs (server-only keys):** `GET /api/voice/status`, `GET /api/voice/voices`, `POST /api/voice/tts`, `POST /api/voice/transcribe`. **AI:** `POST /api/ai/insights`, `POST /api/ai/clinic-summary`, `POST /api/ai/dashboard-chat`.

## Supabase

Migrations: **`../supabase/migrations/`** (from repo root). Apply via CLI or SQL editor on hosted projects.

## Deploy (e.g. Vercel)

Set project **root** to **`web`** (or use workspaces from repo root). Add all env vars from `.env.example`. `prebuild` runs `sync-public` before `next build`.

## Troubleshooting

**Missing webpack chunk (`Cannot find module './NNN.js'`) or odd RSC errors** — Usually a stale **`web/.next`**. Stop the dev server, run `rm -rf web/.next`, then `npm run dev` or `npm run build` again.
