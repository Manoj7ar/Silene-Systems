/**
 * Minimal `**bold**` handling (Gemini often returns this; plain text does not render it).
 * Does not implement full Markdown.
 */

export type BoldSegment = { bold: boolean; text: string };

/** Split text into alternating plain / bold runs using paired `**`. */
export function parseBoldSegments(text: string): BoldSegment[] {
  const out: BoldSegment[] = [];
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf("**", i);
    if (start === -1) {
      if (i < text.length) out.push({ bold: false, text: text.slice(i) });
      break;
    }
    if (start > i) out.push({ bold: false, text: text.slice(i, start) });
    const end = text.indexOf("**", start + 2);
    if (end === -1) {
      out.push({ bold: false, text: text.slice(start) });
      break;
    }
    out.push({ bold: true, text: text.slice(start + 2, end) });
    i = end + 2;
  }
  return out.length > 0 ? out : [{ bold: false, text }];
}

/** Remove `**` for speech; keep inner words. */
export function stripBoldMarkersForSpeech(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}
