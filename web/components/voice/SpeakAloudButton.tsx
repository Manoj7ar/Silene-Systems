"use client";

import { Button } from "@/components/ui/Button";
import {
  createBlobUrlFromTtsResponse,
  friendlyPlaybackError,
  messageFromMediaError,
} from "@/lib/voice/playback";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  className?: string;
};

/**
 * Plays text via ElevenLabs TTS through `/api/voice/tts` (API key stays server-side).
 */
export function SpeakAloudButton({ text, className = "" }: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "error">(
    "idle"
  );
  const [err, setErr] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
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
      cleanup();
    };
  }, [cleanup]);

  async function toggle() {
    setErr(null);
    if (phase === "playing" && audioRef.current) {
      audioRef.current.pause();
      setPhase("idle");
      cleanup();
      return;
    }

    if (!text.trim()) {
      setErr("Nothing to read aloud.");
      setPhase("error");
      return;
    }

    cleanup();
    setPhase("loading");
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        throw new Error(
          data.detail || data.error || `Could not load audio (${res.status})`
        );
      }
      const url = await createBlobUrlFromTtsResponse(res);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPhase("idle");
        cleanup();
      };
      audio.onerror = () => {
        setErr(messageFromMediaError(audio));
        setPhase("error");
        cleanup();
      };
      await audio.play();
      setPhase("playing");
    } catch (e) {
      setErr(friendlyPlaybackError(e));
      setPhase("error");
      cleanup();
    }
  }

  const loading = phase === "loading";

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        size="md"
        loading={loading}
        onClick={() => void toggle()}
        aria-pressed={phase === "playing"}
      >
        {loading
          ? "Preparing…"
          : phase === "playing"
            ? "Stop"
            : "Listen"}
      </Button>
      {err && (
        <p className="mt-2 text-xs text-foreground/70" role="status">
          {err}
        </p>
      )}
    </div>
  );
}
