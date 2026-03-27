# Silene Systems — ElderCare Companion

<p align="center">
  <img src="./silene-clone/logo_dark.svg" alt="Silene Systems" width="200" />
</p>

**ElderCare Companion** is a full-stack web application for older adults and carers: daily check-ins, medications, appointments, AI-assisted insights, voice interaction, and a clinic-ready summary you can export as PDF. It is designed to feel calm, dignified, and easy to use—not clinical or overwhelming.

This repository contains **everything needed to run and deploy the product**, including the Next.js app, Supabase schema, and an optional static landing experience bundled for local preview and hosting.

---

## Why this exists (selling points)

| Pillar | What you get |
|--------|----------------|
| **Voice-first** | Listen to summaries and prompts; optional speech input where the browser allows; ElevenLabs TTS for natural read-aloud when configured. |
| **Continuity of care** | Track mood, symptoms, adherence, and visits in one place—patterns surface on the dashboard instead of scattered notes. |
| **AI that stays grounded** | Insights and clinic summaries are generated from **your logged data** (with clear disclaimers: not a diagnosis, not a substitute for a clinician). |
| **Bring to the appointment** | Generate a plain-language **clinic summary** with PDF export—built for conversation with a GP or specialist, not for self-treatment. |
| **Privacy-minded architecture** | Supabase Auth + row-level security so each user’s health data stays scoped to their account. |

---

## Authorship

**The application layer—the Next.js app, API routes, database integration, AI and voice pipelines, auth flows, and UI—was written end-to-end in this repository.** It is not a white-label install or a no-code export; it is original implementation work you can read, run, and extend here.

Bundled static assets under `silene-clone/` supply an optional marketing-style landing for demos and static hosting; they are packaged for this repo’s workflow (synced into `web/public` on dev/build). Replace copy, logos, and links freely for your own brand or deployment.

---

## Tech stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind-aligned styling  
- **Backend / data:** Supabase (Postgres, Auth, RLS)  
- **AI:** Google Gemini (primary) with optional Anthropic fallback; server-side only keys  
- **Voice:** ElevenLabs TTS and optional transcription APIs (keys stay on the server)

---

## Quick start (full app)

From the **repository root**:

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser. Use **Get started** to sign in or create an account, then open the **Dashboard** at `/app`.

1. Copy **`web/.env.example`** → **`web/.env.local`** and add Supabase URL + anon key (required for real auth and persistence).  
2. Optional: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` for AI and voice features.  
3. Database migrations live in **`supabase/migrations/`** — use the Supabase CLI (see **`web/README.md`**) for local Docker or a hosted project.

---

## Repository layout

```
├── web/                 # ElderCare Companion — Next.js application (main product)
├── supabase/            # Migrations and Supabase config
├── silene-clone/        # Optional static landing; synced into web/public on build
├── package.json         # npm workspaces — run scripts from repo root
└── README.md            # This file
```

Developer-focused details (scripts, every route, troubleshooting) are in **`web/README.md`**. Inside **`web/`**, see **`web/app/README.md`** (routes) and **`web/lib/README.md`** (shared modules).

---

## Deployment

- **Application:** Deploy the **`web`** app (e.g. Vercel): set environment variables from `.env.example`, run production build (`prebuild` syncs the bundled landing into `public/`).  
- **Static-only folder:** You can host **`silene-clone/`** alone as a static site if you only need the landing; full ElderCare requires the Next.js server from **`web/`**.

---

## Medical disclaimer

ElderCare Companion is a **wellness and logging tool**. It does **not** provide medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for health decisions.

---

## License

See the **License** section in this repository if present; use of third-party logos or trademarks in bundled assets remains your responsibility when you ship under your own brand.
