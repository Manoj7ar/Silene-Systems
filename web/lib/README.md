# `lib/` — shared application code

| Path | Purpose |
|------|---------|
| **`actions/`** | Server Actions (`"use server"`) — mutations, revalidation |
| **`ai/`** | Gemini / Anthropic prompts (`runAiPrompt`, …) |
| **`dashboard/`** | Dashboard analytics, health chart series, AI context builder |
| **`demo/`** | Demo seed data helpers |
| **`supabase/`** | Browser client, server client, middleware session helper |
| **`text/`** | Plain-text helpers (e.g. `**bold**` parsing for summaries) |
| **`voice/`** | Browser playback error helpers (autoplay / permission UX) |
| **`utils.ts`** | Small shared utilities (`cn`, …) |

Import with the `@/` alias, e.g. `@/lib/dashboard/analytics`, `@/lib/actions/demo`.
