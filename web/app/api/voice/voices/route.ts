import { NextResponse } from "next/server";

const ELEVEN_VOICES = "https://api.elevenlabs.io/v1/voices";

export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key?.trim()) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set", voices: [] },
      { status: 503 }
    );
  }

  const upstream = await fetch(`${ELEVEN_VOICES}?show_legacy=true`, {
    headers: { "xi-api-key": key },
    next: { revalidate: 3600 },
  });

  if (!upstream.ok) {
    const t = await upstream.text();
    return NextResponse.json(
      { error: "Could not list voices", detail: t.slice(0, 300), voices: [] },
      { status: 502 }
    );
  }

  const data = (await upstream.json()) as {
    voices?: { voice_id: string; name: string; category?: string }[];
  };
  const voices = (data.voices ?? []).map((v) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category ?? "",
  }));

  return NextResponse.json({ voices });
}
