"use client";

import { Button } from "@/components/ui/Button";
import {
  friendlyPlaybackError,
  isNotAllowedMediaError,
} from "@/lib/voice-playback";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_TTS_CHARS = 4000;

type ChatMessage = { role: "user" | "assistant"; content: string };

type Pending = "idle" | "brief" | "chat" | "tts";

/** Minimal browser speech-recognition handle (Web Speech API; types vary by TS lib). */
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

export function DashboardVoiceAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [listening, setListening] = useState(false);
  /** TTS blob URL kept when autoplay is blocked until user taps Play voice. */
  const [ttsNeedsTap, setTtsNeedsTap] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const recRef = useRef<SpeechRecHandle | null>(null);

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
          };
          throw new Error(data.error ?? `Voice failed (${res.status})`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
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
              "Automatic playback was blocked. Tap Play voice below (that counts as permission to play sound)."
            );
            return;
          }
          throw playErr;
        }
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Playback failed"));
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
        audio.onerror = () => reject(new Error("Playback failed"));
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

  async function runBrief() {
    setErr(null);
    setPending("brief");
    try {
      const res = await fetch("/api/ai/dashboard-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "brief" }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not load dashboard summary");
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

  async function sendQuestion() {
    const userMessage = input.trim();
    if (!userMessage || pending !== "idle") return;
    setInput("");
    setErr(null);
    setPending("chat");
    try {
      const res = await fetch("/api/ai/dashboard-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          messages,
          userMessage,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not get an answer");
      }
      const reply = data.reply?.trim() ?? "";
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: reply },
      ]);
      if (autoSpeak && reply) await playTts(reply);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPending("idle");
    }
  }

  function toggleMic() {
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
      if (code === "not-allowed" || code === "service-not-allowed") {
        setErr(
          "Microphone is blocked. Allow the mic for this site in your browser (lock icon in the address bar), or type your question."
        );
        return;
      }
      setErr("Could not capture speech. Try again or type your question.");
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setErr("Could not start microphone.");
    }
  }

  const briefLoading = pending === "brief";
  const chatLoading = pending === "chat";
  const speaking = pending === "tts";
  const blockInput = pending !== "idle";

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          loading={briefLoading}
          onClick={() => void runBrief()}
          aria-label="Listen to dashboard summary"
        >
          {speaking ? "Speaking…" : "Listen"}
        </Button>
        {speaking && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={stopSpeaking}
          >
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
        <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground/70">
          <input
            type="checkbox"
            className="rounded border-primary/30"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
          />
          Speak replies
        </label>
      </div>

      <p className="text-xs text-foreground/60">
        Hear a summary of what is on this page, then ask follow-up questions.
        Answers use your latest saved data from the server.
      </p>

      {messages.length > 0 && (
        <div
          className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm"
          aria-live="polite"
        >
          {messages.map((m, i) => (
            <p
              key={`${m.role}-${i}`}
              className={
                m.role === "user"
                  ? "text-foreground/90"
                  : "text-foreground/80"
              }
            >
              <span className="font-semibold text-primary-dark">
                {m.role === "user" ? "You" : "Companion"}
              </span>
              {": "}
              {m.content}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void sendQuestion();
          }}
          placeholder="Ask about your mood, meds, visits…"
          className="min-w-[12rem] flex-1 rounded-lg border border-primary/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/45 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          disabled={blockInput}
          aria-label="Question about your dashboard data"
        />
        <Button
          type="button"
          variant={listening ? "primary" : "secondary"}
          size="md"
          onClick={toggleMic}
          disabled={blockInput}
          aria-pressed={listening}
          title="Speak your question (browser)"
        >
          {listening ? "Listening…" : "Mic"}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          loading={chatLoading}
          onClick={() => void sendQuestion()}
          disabled={!input.trim() || pending !== "idle"}
        >
          Ask
        </Button>
      </div>

      {err && (
        <p className="text-xs text-red-800 dark:text-red-200" role="status">
          {err}
        </p>
      )}
    </div>
  );
}
