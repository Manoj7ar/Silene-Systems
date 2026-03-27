/**
 * Ask for microphone access before Web Speech API. Browsers often show a clear
 * prompt here; SpeechRecognition alone can fail with an opaque "not-allowed".
 */
export async function ensureMicrophonePermission(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (typeof navigator === "undefined") {
    return { ok: true };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: true };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (e) {
    if (e instanceof DOMException && e.name === "NotAllowedError") {
      return {
        ok: false,
        message:
          "Microphone access was denied. Open site settings (lock or tune icon in the address bar), allow Microphone for this site, then tap Mic again. You can type your question instead.",
      };
    }
    return {
      ok: false,
      message:
        "Could not access the microphone (unplugged or in use?). You can type your question instead.",
    };
  }
}

/** Map Web Speech API `error` codes to short copy. Empty string = no banner (benign). */
export function speechRecognitionErrorMessage(code: string | undefined): string {
  switch (code) {
    case "aborted":
    case "no-speech":
      return "";
    case "not-allowed":
      return (
        "Speech input was blocked. Allow the microphone for this site in your browser settings, then try Mic again — or type below."
      );
    case "service-not-allowed":
      return (
        "This browser’s built-in speech isn’t available (private mode or strict privacy). " +
        "Type instead, try a normal window in Chrome or Edge, or use Speak when server transcription is enabled."
      );
    case "audio-capture":
      return "No microphone was found. Plug one in or type your question.";
    case "network":
      return "Speech recognition had a network error. Try again or type your question.";
    default:
      return code
        ? "Could not capture speech. Try again or type your question."
        : "";
  }
}
