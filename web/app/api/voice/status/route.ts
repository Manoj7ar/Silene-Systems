import { NextResponse } from "next/server";

/** Exposes which voice features are configured (no secrets). */
export async function GET() {
  const key = !!process.env.ELEVENLABS_API_KEY?.trim();
  return NextResponse.json({
    tts: key,
    stt: key,
  });
}
