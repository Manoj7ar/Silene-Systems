import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

const ELEVEN_STT = "https://api.elevenlabs.io/v1/speech-to-text";

/** ~5 MB — keeps uploads predictable on serverless */
const MAX_BYTES = 5 * 1024 * 1024;

const DEFAULT_STT_MODEL = "scribe_v2";

function extractTranscript(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const o = data as Record<string, unknown>;
  if (typeof o.text === "string") return o.text.trim();
  if (Array.isArray(o.transcripts)) {
    return o.transcripts
      .map((t) => {
        if (t && typeof t === "object" && "text" in t) {
          const x = (t as { text?: unknown }).text;
          return typeof x === "string" ? x : "";
        }
        return "";
      })
      .filter(Boolean)
      .join(" ")
      .trim();
  }
  return "";
}

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key?.trim()) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 400 }
    );
  }

  const langRaw = formData.get("language_code");
  const languageCode =
    typeof langRaw === "string" && langRaw.trim() ? langRaw.trim() : undefined;

  const modelId =
    process.env.ELEVENLABS_STT_MODEL_ID?.trim() || DEFAULT_STT_MODEL;

  const upstreamForm = new FormData();
  upstreamForm.append("file", file);
  upstreamForm.append("model_id", modelId);
  upstreamForm.append("tag_audio_events", "false");
  upstreamForm.append("timestamps_granularity", "none");
  if (languageCode) {
    upstreamForm.append("language_code", languageCode);
  }

  const upstream = await fetch(`${ELEVEN_STT}?enable_logging=true`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
    },
    body: upstreamForm,
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: "Transcription failed",
        detail: raw.slice(0, 500),
      },
      { status: 502 }
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json(
      { error: "Invalid response from speech service" },
      { status: 502 }
    );
  }

  const text = extractTranscript(json);
  if (!text) {
    return NextResponse.json(
      { error: "No speech detected", detail: raw.slice(0, 200) },
      { status: 422 }
    );
  }

  return NextResponse.json({ text });
}
