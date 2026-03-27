# `app/` — Next.js App Router

| Area | Path | URLs |
|------|------|------|
| **Signed-in product** | `(dashboard)/app/` | `/app`, `/app/check-in`, `/app/medications`, … |
| **Marketing shell** | `(marketing)/` | `/` (landing iframe) |
| **Auth** | `auth/` | `/auth/login`, `/auth/signup`, `/auth/callback`, … |
| **API** | `api/` | `/api/ai/*`, `/api/voice/*` |
| **Entry** | `get-started/` | `/get-started` |

The **`(dashboard)`** segment is a [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) (parentheses = no URL segment). It only wraps the real **`app`** path so the folder tree reads clearly; URLs are unchanged (`/app/*`).
