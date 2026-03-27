import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** ElevenLabs character limits vary by plan; stay conservative for one request. */
const MAX_CHARS = 4000;

const ELEVEN_API = "https://api.elevenlabs.io/v1/text-to-speech";

/** Query param — forces MP3 (see ElevenLabs “output_format” docs). Override if your plan requires a different preset. */
const OUTPUT_FORMAT =
  process.env.ELEVENLABS_OUTPUT_FORMAT?.trim() || "mp3_44100_128";

/** Default ElevenLabs voice; override with `ELEVENLABS_VOICE_ID` or profile `tts_voice_id`. */
const DEFAULT_VOICE_ID = "jqcCZkN6Knx8BJ5TBdYR";

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key?.trim()) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "text" in body &&
    typeof (body as { text: unknown }).text === "string"
      ? (body as { text: string }).text.trim()
      : "";

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const clipped = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  let voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tts_voice_id")
        .eq("id", user.id)
        .single();
      const vid = profile?.tts_voice_id?.trim();
      if (vid) voiceId = vid;
    }
  } catch {
    /* use env/default */
  }

  const modelId =
    process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";

  const ttsBody = {
    text: clipped,
    model_id: modelId,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  };

  const url = `${ELEVEN_API}/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(OUTPUT_FORMAT)}`;

  let upstream = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(ttsBody),
  });

  /** Invalid saved voice in profile — retry once with default voice. */
  if (
    !upstream.ok &&
    (upstream.status === 400 || upstream.status === 404) &&
    voiceId !== DEFAULT_VOICE_ID
  ) {
    const fallbackUrl = `${ELEVEN_API}/${encodeURIComponent(DEFAULT_VOICE_ID)}?output_format=${encodeURIComponent(OUTPUT_FORMAT)}`;
    upstream = await fetch(fallbackUrl, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(ttsBody),
    });
  }

  if (!upstream.ok) {
    const errText = await upstream.text();
    return NextResponse.json(
      {
        error: "ElevenLabs request failed",
        detail: errText.slice(0, 500),
      },
      { status: 502 }
    );
  }

  const audio = await upstream.arrayBuffer();
  if (audio.byteLength < 64) {
    return NextResponse.json(
      {
        error: "ElevenLabs returned empty audio",
        detail: "Check API key, quota, and voice ID.",
      },
      { status: 502 }
    );
  }

  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
