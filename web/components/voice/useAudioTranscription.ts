"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "recording" | "uploading";

const DEFAULT_MAX_MS = 60_000;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

export function useAudioTranscription(options: {
  onTranscript: (text: string) => void;
  languageCode?: string;
  maxDurationMs?: number;
}) {
  const { onTranscript, languageCode, maxDurationMs = DEFAULT_MAX_MS } =
    options;
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setErr(null);
    cleanupStream();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErr("Microphone is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onerror = () => {
        setErr("Recording error.");
        setPhase("idle");
        cleanupStream();
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        cleanupStream();
        if (blob.size < 100) {
          setErr("Recording too short.");
          setPhase("idle");
          return;
        }
        setPhase("uploading");
        try {
          const fd = new FormData();
          fd.append("file", blob, "recording.webm");
          if (languageCode) fd.append("language_code", languageCode);
          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: fd,
          });
          const data = (await res.json().catch(() => ({}))) as {
            text?: string;
            error?: string;
          };
          if (!res.ok) {
            throw new Error(data.error ?? `Request failed (${res.status})`);
          }
          if (typeof data.text === "string" && data.text.trim()) {
            onTranscript(data.text.trim());
          } else {
            throw new Error("No text returned");
          }
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Transcription failed");
        } finally {
          setPhase("idle");
        }
      };
      rec.start(200);
      setPhase("recording");
      timerRef.current = setTimeout(() => {
        rec.stop();
      }, maxDurationMs);
    } catch {
      setErr("Microphone permission denied or unavailable.");
    }
  }, [cleanupStream, languageCode, maxDurationMs, onTranscript]);

  const toggleRecording = useCallback(() => {
    if (phase === "recording") {
      stopRecording();
      return;
    }
    if (phase === "uploading") return;
    void startRecording();
  }, [phase, startRecording, stopRecording]);

  return {
    phase,
    err,
    setErr,
    isRecording: phase === "recording",
    isUploading: phase === "uploading",
    toggleRecording,
    startRecording,
    stopRecording,
  };
}
