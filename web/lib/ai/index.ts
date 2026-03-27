import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEMO_REPLY =
  "[Demo mode — add GEMINI_API_KEY or ANTHROPIC_API_KEY in web/.env.local] " +
  "Here is a placeholder. Configure an API key to enable AI insights and clinic summaries. " +
  "The patient has logged symptoms and medications in ElderCare Companion; review trends with their clinician.";

/**
 * Default chain when `GEMINI_MODEL` is unset: newest / strongest first, older models as fallback.
 * If `GEMINI_MODEL` is set in `.env.local`, that model is tried first, then this list (deduped).
 *
 * Do not use deprecated aliases like `gemini-1.5-flash-latest` — they return 404 on current API.
 */
const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash",
] as const;

/** Map retired API names so env vars from old docs still work. */
function normalizePreferredModel(preferred: string | null | undefined): string | null {
  const t = preferred?.trim();
  if (!t) return null;
  if (t === "gemini-1.5-flash-latest") return "gemini-1.5-flash";
  return t;
}

function uniqueModels(preferred?: string | null): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (m: string) => {
    const t = m.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  const p = normalizePreferredModel(preferred);
  if (p) add(p);
  for (const m of GEMINI_MODEL_FALLBACKS) add(m);
  return out;
}

function isQuotaOrRateLimitError(err: unknown): boolean {
  const s =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: string }).message)
        : String(err);
  return /429|Too Many Requests|quota|RESOURCE_EXHAUSTED|rate limit/i.test(s);
}

function isModelNotFoundError(err: unknown): boolean {
  const s =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: string }).message)
        : String(err);
  return /404|not found|is not found for API version/i.test(s);
}

function extractGeminiText(result: {
  response: {
    text: () => string;
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
}): string {
  const response = result.response;
  try {
    const text = response.text();
    return text?.trim() ?? "";
  } catch {
    const cand = response.candidates?.[0];
    const parts = cand?.content?.parts;
    if (parts && Array.isArray(parts)) {
      const t = parts
        .map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim();
      if (t) return t;
    }
    return "";
  }
}

async function runGemini(system: string, user: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const envModel = normalizePreferredModel(
    process.env.GEMINI_MODEL?.trim() || null
  );
  const genAI = new GoogleGenerativeAI(key);
  const models = uniqueModels(envModel);

  let lastErr: unknown;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: system,
      });
      const result = await model.generateContent(user);
      const text = extractGeminiText(result);
      if (text) return text;
    } catch (e) {
      lastErr = e;
      console.warn(`[ai] Gemini model "${modelName}" failed:`, e);
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error(
        String(lastErr ?? "All Gemini models failed — check API key and Generative Language API access.")
      );
}

async function runAnthropic(system: string, user: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");

  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  const block = msg.content[0];
  if (block.type === "text") return block.text;
  return "";
}

function formatAiFailure(err: unknown): string {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: string }).message)
        : String(err);
  const short = msg.slice(0, 220);

  if (isQuotaOrRateLimitError(err)) {
    return (
      `[Google AI quota or rate limit reached — try again in a few minutes.] ` +
      `Check usage and limits in Google AI Studio for this API key’s project. ` +
      `To reduce usage, set GEMINI_MODEL=gemini-2.5-flash-lite in web/.env.local. ` +
      `Adding ANTHROPIC_API_KEY enables automatic fallback when Gemini is over quota.`
    );
  }

  if (isModelNotFoundError(err)) {
    return (
      `[Gemini model not available for this API key or region.] ` +
      `Remove or update GEMINI_MODEL in web/.env.local — use a current id such as gemini-2.5-flash or gemini-2.0-flash-001 ` +
      `(see https://ai.google.dev/gemini-api/docs/models ). Technical detail: ${short}`
    );
  }

  return (
    `[AI could not complete this request: ${short}] ` +
    `Confirm GEMINI_API_KEY in Google AI Studio, enable the Generative Language API for the key’s project, ` +
    `and optionally set GEMINI_MODEL=gemini-2.5-flash in web/.env.local.`
  );
}

/**
 * Runs the ElderCare AI prompt. Prefers **Gemini** when `GEMINI_API_KEY` is set,
 * otherwise **Anthropic** when `ANTHROPIC_API_KEY` is set, otherwise demo copy.
 */
export async function runAiPrompt(system: string, user: string): Promise<string> {
  if (process.env.GEMINI_API_KEY?.trim()) {
    try {
      return await runGemini(system, user);
    } catch (e) {
      console.error("[ai] Gemini error:", e);
      if (
        process.env.ANTHROPIC_API_KEY?.trim() &&
        isQuotaOrRateLimitError(e)
      ) {
        try {
          console.warn(
            "[ai] Falling back to Anthropic after Gemini quota/rate limit"
          );
          return await runAnthropic(system, user);
        } catch (e2) {
          console.error("[ai] Anthropic fallback error:", e2);
        }
      }
      return formatAiFailure(e);
    }
  }

  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    try {
      return await runAnthropic(system, user);
    } catch (e) {
      console.error("[ai] Anthropic error:", e);
      return "[AI error — check ANTHROPIC_API_KEY and billing.]";
    }
  }

  return DEMO_REPLY;
}

/** @deprecated Use `runAiPrompt` — kept for older imports */
export async function runClaudePrompt(
  system: string,
  user: string
): Promise<string> {
  return runAiPrompt(system, user);
}
