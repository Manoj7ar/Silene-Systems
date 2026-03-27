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
