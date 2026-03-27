"use client";

import { Button } from "@/components/ui/Button";
import { useAudioTranscription } from "@/components/voice/useAudioTranscription";
import {
  ensureMicrophonePermission,
  speechRecognitionErrorMessage,
} from "@/lib/voice/mic-access";
import {
  createBlobUrlFromTtsResponse,
  friendlyPlaybackError,
  isNotAllowedMediaError,
  messageFromMediaError,
} from "@/lib/voice/playback";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_TTS_CHARS = 4000;

type ChatMessage = { role: "user" | "assistant"; content: string };
type Pending = "idle" | "opening" | "chat" | "tts";

type SpeechRecHandle = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: unknown) => void) | null;
  onerror: ((ev?: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function clipForTts(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_TTS_CHARS) return t;
  return `${t.slice(0, MAX_TTS_CHARS - 20)}… [truncated for voice]`;
}

export function AppVoiceAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [listening, setListening] = useState(false);
  const [micLoading, setMicLoading] = useState(false);
  const [cloudStt, setCloudStt] = useState(false);
  const [ttsNeedsTap, setTtsNeedsTap] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const recRef = useRef<SpeechRecHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
      recRef.current?.stop();
    };
  }, [cleanupAudio]);

  useEffect(() => {
    void fetch("/api/voice/status")
      .then((r) => r.json())
      .then((d: { stt?: boolean }) => setCloudStt(!!d.stt))
      .catch(() => setCloudStt(false));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const appendToInput = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const {
    err: recordErr,
    isRecording,
    isUploading,
    toggleRecording,
  } = useAudioTranscription({
    onTranscript: appendToInput,
    languageCode: "en",
  });

  const playTts = useCallback(
    async (text: string) => {
      const clipped = clipForTts(text);
      if (!clipped) return;
      setTtsNeedsTap(false);
      cleanupAudio();
      setPending("tts");
      setErr(null);
      let playBlocked = false;
      try {
        const res = await fetch("/api/voice/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clipped }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            detail?: string;
          };
          throw new Error(
            data.detail || data.error || `Voice failed (${res.status})`
          );
        }
        const url = await createBlobUrlFromTtsResponse(res);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        try {
          await audio.play();
        } catch (playErr) {
          if (isNotAllowedMediaError(playErr)) {
            playBlocked = true;
            setTtsNeedsTap(true);
            setPending("idle");
            setErr(
              "Tap Play voice to hear the reply (browser blocked autoplay)."
            );
            return;
          }
          throw playErr;
        }
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () =>
            reject(new Error(messageFromMediaError(audio)));
        });
      } catch (e) {
        setErr(friendlyPlaybackError(e));
      } finally {
        if (!playBlocked) {
          setPending("idle");
          cleanupAudio();
          setTtsNeedsTap(false);
        }
      }
    },
    [cleanupAudio]
  );

  const playTtsFromUserTap = useCallback(async () => {
    const url = urlRef.current;
    if (!url) return;
    setErr(null);
    setPending("tts");
    const audio = new Audio(url);
    audioRef.current = audio;
    try {
      await audio.play();
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () =>
          reject(new Error(messageFromMediaError(audio)));
      });
    } catch (e) {
      setErr(friendlyPlaybackError(e));
    } finally {
      setPending("idle");
      cleanupAudio();
      setTtsNeedsTap(false);
    }
  }, [cleanupAudio]);

  const stopSpeaking = useCallback(() => {
    if (pending === "tts") {
      cleanupAudio();
      setPending("idle");
      setTtsNeedsTap(false);
    }
  }, [pending, cleanupAudio]);

  async function runVoiceOpen() {
    setErr(null);
    setPending("opening");
    try {
      const res = await fetch("/api/ai/dashboard-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "voiceOpen" }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not start conversation");
      }
      const reply = data.reply?.trim() ?? "";
      setMessages([{ role: "assistant", content: reply }]);
      if (autoSpeak && reply) await playTts(reply);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPending("idle");
    }
  }

  async function sendMessage() {
    const userMessage = input.trim();
    if (!userMessage || pending !== "idle") return;
    setInput("");
    setErr(null);
    setPending("chat");
    const nextMessages = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];
    setMessages(nextMessages);
    try {
      const res = await fetch("/api/ai/dashboard-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          dialogueMode: true,
          messages,
          userMessage,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not get a reply");
      }
      const reply = data.reply?.trim() ?? "";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
      if (autoSpeak && reply) await playTts(reply);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      setMessages(messages);
    } finally {
      setPending("idle");
    }
  }

  function handlePrimaryVoice() {
    if (cloudStt) {
      void toggleRecording();
      return;
    }
    void toggleMic();
  }

  async function toggleMic() {
    if (typeof window === "undefined") return;
    const Ctor =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecHandle;
          webkitSpeechRecognition?: new () => SpeechRecHandle;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechRecHandle;
        }
      ).webkitSpeechRecognition;
    if (!Ctor) {
      setErr("Voice input is not supported in this browser.");
      return;
    }

    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    setErr(null);
    setMicLoading(true);
    const mic = await ensureMicrophonePermission();
    setMicLoading(false);
    if (!mic.ok) {
      setErr(mic.message);
      return;
    }

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: unknown) => {
      const results = (ev as { results?: Array<{ 0?: { transcript?: string } }> })
        .results;
      const text = results?.[0]?.[0]?.transcript?.trim();
      if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
    };
    rec.onerror = (ev: unknown) => {
      setListening(false);
      const code = (ev as { error?: string }).error;
      const msg = speechRecognitionErrorMessage(code);
      if (msg) setErr(msg);
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setErr("Could not start microphone.");
    }
  }

  function newConversation() {
    cleanupAudio();
    setMessages([]);
    setInput("");
    setErr(null);
    setTtsNeedsTap(false);
    setPending("idle");
  }

  const blockInput = pending !== "idle";
  const speaking = pending === "tts";
  const busy = pending === "opening" || pending === "chat";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {open ? (
      <div
        id="app-voice-agent-panel"
        className="pointer-events-auto flex max-h-[min(72vh,520px)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-primary/20 bg-background shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
        role="dialog"
        aria-label="Voice companion chat"
      >
        <div className="flex items-center justify-between border-b border-primary/15 bg-primary/5 px-3 py-2">
          <div>
            <p className="font-serif text-sm font-semibold text-primary-dark">
              Voice companion
            </p>
            <p className="text-[10px] text-foreground/55">
              Uses your dashboard data on each reply
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => newConversation()}
              className="rounded-lg px-2 py-1 text-[11px] font-medium text-primary-dark/80 hover:bg-primary/10"
            >
              New chat
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-foreground/60 hover:bg-primary/10 hover:text-foreground"
              aria-label="Close voice companion"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="min-h-[140px] flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm"
          role="log"
          aria-live="polite"
        >
          {messages.length === 0 && !busy ? (
            <p className="text-foreground/65">
              Have a conversation about your mood, medications, and visits. Answers
              use numbers and records from this app.
            </p>
          ) : null}
          {messages.map((m, i) => (
            <p
              key={`${m.role}-${i}-${m.content.slice(0, 24)}`}
              className={
                m.role === "user"
                  ? "text-foreground/90"
                  : "text-foreground/85"
              }
            >
              <span className="font-semibold text-primary-dark">
                {m.role === "user" ? "You" : "Companion"}
              </span>
              {": "}
              {m.content}
            </p>
          ))}
          {(pending === "opening" || pending === "chat") && (
            <p className="text-foreground/50">…</p>
          )}
        </div>

        <div className="border-t border-primary/15 bg-surface-alt/80 px-3 py-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {messages.length === 0 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                loading={pending === "opening"}
                onClick={() => void runVoiceOpen()}
                disabled={blockInput}
              >
                Start conversation
              </Button>
            ) : null}
            {speaking && (
              <Button type="button" variant="ghost" size="md" onClick={stopSpeaking}>
                Stop voice
              </Button>
            )}
            {ttsNeedsTap && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => void playTtsFromUserTap()}
              >
                Play voice
              </Button>
            )}
            <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[10px] text-foreground/60">
              <input
                type="checkbox"
                className="rounded border-primary/30"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
              />
              Speak replies
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendMessage();
              }}
              placeholder={
                messages.length === 0
                  ? "Or type after you start…"
                  : "Type your reply…"
              }
              disabled={blockInput || messages.length === 0}
              className="min-w-0 flex-1 rounded-lg border border-primary/20 bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-foreground/45 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              aria-label="Your message to the companion"
            />
            <Button
              type="button"
              variant={
                cloudStt ? (isRecording ? "primary" : "secondary") : listening ? "primary" : "secondary"
              }
              size="md"
              onClick={handlePrimaryVoice}
              disabled={
                blockInput ||
                messages.length === 0 ||
                (cloudStt
                  ? isUploading
                  : micLoading || isRecording || isUploading)
              }
              loading={cloudStt ? isUploading : micLoading}
              aria-pressed={cloudStt ? isRecording : listening}
              title={
                cloudStt
                  ? "Server transcription"
                  : "Browser speech recognition"
              }
            >
              {cloudStt
                ? isRecording
                  ? "Stop"
                  : isUploading
                    ? "…"
                    : "Speak"
                : listening
                  ? "Listening"
                  : "Mic"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={pending === "chat"}
              onClick={() => void sendMessage()}
              disabled={!input.trim() || blockInput || messages.length === 0}
            >
              Send
            </Button>
          </div>
          {recordErr && (
            <p className="mt-1 text-[11px] text-red-800 dark:text-red-200" role="alert">
              {recordErr}
            </p>
          )}
          {err && (
            <p className="mt-1 text-[11px] text-red-800 dark:text-red-200" role="status">
              {err}
            </p>
          )}
        </div>
      </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary text-white shadow-[var(--shadow-card-hover)] transition-transform hover:scale-[1.03] active:scale-[0.98] motion-safe"
        style={{ marginBottom: "max(0px, env(safe-area-inset-bottom))" }}
        aria-expanded={open}
        aria-controls="app-voice-agent-panel"
        title="Open voice companion"
      >
        <span className="sr-only">Open or close voice companion</span>
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
        </svg>
      </button>
    </div>
  );
}
