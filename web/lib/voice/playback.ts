/**
 * Build a blob URL from a successful `/api/voice/tts` response.
 * Validates non-empty MP3-ish payload; detects JSON error bodies returned with wrong status.
 */
export async function createBlobUrlFromTtsResponse(res: Response): Promise<string> {
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 32) {
    throw new Error(
      "No audio data received. Check ELEVENLABS_API_KEY, quota, and voice settings."
    );
  }
  const first = new Uint8Array(buf.slice(0, 1))[0];
  if (first === 0x7b) {
    const text = new TextDecoder().decode(buf.slice(0, 4000));
    let parsed: { error?: string; detail?: string };
    try {
      parsed = JSON.parse(text) as { error?: string; detail?: string };
    } catch {
      throw new Error("Voice API returned invalid data instead of audio.");
    }
    throw new Error(
      parsed.detail || parsed.error || "Voice API returned JSON instead of audio."
    );
  }
  const ct = res.headers.get("content-type") || "";
  const mime = /mpeg|mp3|audio/i.test(ct) ? "audio/mpeg" : "audio/mpeg";
  const blob = new Blob([buf], { type: mime });
  return URL.createObjectURL(blob);
}

/** Human-readable reason when HTMLMediaElement fires `error`. */
export function messageFromMediaError(audio: HTMLAudioElement): string {
  const err = audio.error;
  if (!err) return "Playback failed.";
  const M = typeof MediaError !== "undefined" ? MediaError : null;
  if (M) {
    if (err.code === M.MEDIA_ERR_DECODE) {
      return (
        "Could not decode audio. Try again, or set ELEVENLABS_OUTPUT_FORMAT=mp3_22050_32 " +
        "in web/.env.local if your plan limits high-bitrate MP3."
      );
    }
    if (err.code === M.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      return "This browser cannot play this audio format.";
    }
    if (err.code === M.MEDIA_ERR_NETWORK) {
      return "Network error while loading audio.";
    }
  }
  return "Playback failed.";
}

/** Browser blocked audio/mic (autoplay policy, denied permission, insecure context). */
export function isNotAllowedMediaError(err: unknown): boolean {
  if (typeof DOMException !== "undefined" && err instanceof DOMException) {
    if (err.name === "NotAllowedError") return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /not allowed|denied permission|NotAllowedError|user denied/i.test(msg);
}

export function friendlyPlaybackError(err: unknown): string {
  if (isNotAllowedMediaError(err)) {
    return (
      "Sound was blocked by the browser. Tap “Play voice” if shown, allow audio for this site " +
      "in your browser settings, or use a normal click on Listen (not a background tab)."
    );
  }
  return err instanceof Error ? err.message : "Voice unavailable";
}
