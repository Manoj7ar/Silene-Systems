"use client";

import { saveDailyLog } from "@/app/actions/daily";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { useAudioTranscription } from "@/components/voice/useAudioTranscription";
import { useCallback, useEffect, useState } from "react";

const FORM_ID = "daily-checkin-form";

function sttLanguageHint(bcp47: string): string | undefined {
  const base = bcp47.trim().split(/[-_]/)[0];
  if (!base || base.length < 2) return undefined;
  return base.toLowerCase();
}

export function CheckInForm({
  speechLanguage = "en-IE",
}: {
  speechLanguage?: string;
}) {
  const [symptoms, setSymptoms] = useState("");
  const [mood, setMood] = useState("");
  const [moodRating, setMoodRating] = useState<number | null>(3);
  const [notes, setNotes] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [cloudStt, setCloudStt] = useState(false);

  useEffect(() => {
    void fetch("/api/voice/status")
      .then((r) => r.json())
      .then((d: { stt?: boolean }) => setCloudStt(!!d.stt))
      .catch(() => setCloudStt(false));
  }, []);

  const appendTranscript = useCallback((text: string) => {
    setVoiceTranscript((v) => (v ? `${v} ${text}` : text));
    setSymptoms((s) => (s ? `${s} ${text}` : text));
  }, []);

  const {
    err: recordErr,
    isRecording,
    isUploading,
    toggleRecording,
  } = useAudioTranscription({
    onTranscript: appendTranscript,
    languageCode: sttLanguageHint(speechLanguage),
  });

  function startListening() {
    if (typeof window === "undefined") return;
    type SpeechRecCtor = new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      onresult:
        | ((ev: { results: { transcript: string }[][] }) => void)
        | null;
      onend: (() => void) | null;
      onerror: ((ev?: unknown) => void) | null;
    };
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecCtor;
      webkitSpeechRecognition?: SpeechRecCtor;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setStatus("Speech recognition is not supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = speechLanguage.trim() || "en-IE";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (ev: { results: { transcript: string }[][] }) => {
      const text = ev.results[0][0].transcript;
      setVoiceTranscript((v) => (v ? `${v} ${text}` : text));
      setSymptoms((s) => (s ? `${s} ${text}` : text));
    };
    rec.onend = () => setListening(false);
    rec.onerror = (ev: unknown) => {
      setListening(false);
      const code = (ev as { error?: string }).error;
      if (code === "not-allowed" || code === "service-not-allowed") {
        setStatus(
          "Microphone is blocked for speech recognition. Allow the mic for this site or type instead."
        );
      }
    };
    setListening(true);
    rec.start();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await saveDailyLog({
        symptoms,
        mood,
        moodRating,
        notes,
        voiceTranscript,
      });
      setStatus("Saved — thank you.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save");
    }
  }

  return (
    <>
      <form
        id={FORM_ID}
        onSubmit={(e) => void submit(e)}
        className="space-y-6"
      >
        <Card>
          <h2 className="font-serif text-lg font-semibold text-primary-dark">
            Mood
          </h2>
          <label className="mt-3 block text-sm font-medium text-primary-dark">
            How are you feeling today?
          </label>
          <Textarea
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            rows={4}
            className="mt-2 text-lg"
            placeholder="A few words is enough"
          />

          <p className="mt-6 text-sm font-medium text-primary-dark">Mood 1–5</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMoodRating(n)}
                className={`motion-safe min-h-[52px] min-w-[52px] rounded-full border-2 text-lg font-semibold transition-colors duration-[var(--duration-short)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] ${
                  moodRating === n
                    ? "border-primary bg-primary text-white shadow-[var(--shadow-card)]"
                    : "border-primary/30 text-primary-dark hover:bg-primary/10"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-lg font-semibold text-primary-dark">
            Symptoms & notes
          </h2>
          <label className="mt-3 block text-sm font-medium text-primary-dark">
            Any pain, dizziness, or shortness of breath?
          </label>
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
            className="mt-2 text-lg"
          />

          <label className="mt-6 block text-sm font-medium text-primary-dark">
            Other notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2 text-lg"
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={startListening}
              disabled={listening || isRecording || isUploading}
            >
              {listening ? "Listening…" : "Speak answers"}
            </Button>
            {cloudStt ? (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                loading={isUploading}
                onClick={() => void toggleRecording()}
                disabled={listening}
              >
                {isRecording
                  ? "Stop & transcribe"
                  : isUploading
                    ? "Transcribing…"
                    : "Record & transcribe"}
              </Button>
            ) : null}
          </div>
          {recordErr && (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {recordErr}
            </p>
          )}
          <p className="mt-2 text-xs text-foreground/55">
            Speak answers uses your browser when available. Record & transcribe
            uses ElevenLabs when configured — works in more browsers.
          </p>
          {voiceTranscript && (
            <p className="mt-3 text-sm text-foreground/60">Heard: {voiceTranscript}</p>
          )}
        </Card>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="hidden w-full sm:inline-flex"
        >
          Save check-in
        </Button>
        {status && (
          <p
            className="text-center text-sm text-primary-dark sm:pb-0"
            role="status"
            aria-live="polite"
          >
            {status}
          </p>
        )}
      </form>

      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-primary/15 bg-background/95 p-4 shadow-[var(--shadow-card-hover)] backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <Button
          type="submit"
          form={FORM_ID}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Save check-in
        </Button>
      </div>
    </>
  );
}
