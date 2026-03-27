"use client";

import { updateVoicePreferences } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";

type VoiceOpt = { voice_id: string; name: string; category: string };

export function VoiceSettingsForm({
  initialVoiceId,
  initialLanguage,
}: {
  initialVoiceId: string | null;
  initialLanguage: string;
}) {
  const [voices, setVoices] = useState<VoiceOpt[]>([]);
  const [voiceId, setVoiceId] = useState(initialVoiceId ?? "");
  const [language, setLanguage] = useState(initialLanguage);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/voice/voices")
      .then((r) => r.json())
      .then((d: { voices?: VoiceOpt[] }) => setVoices(d.voices ?? []))
      .catch(() => setVoices([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      await updateVoicePreferences({
        tts_voice_id: voiceId.trim() || null,
        speech_language: language.trim() || "en-IE",
      });
      setMsg("Saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <h2 className="font-serif text-lg font-semibold text-primary-dark">
        Voice & language
      </h2>
      <p className="mt-1 text-sm text-foreground/70">
        Choose a read-aloud voice for Listen buttons, and a language for browser
        speech and transcription hints (e.g. en-IE, en-GB, en-US).
      </p>
      <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="tts-voice"
            className="block text-sm font-medium text-primary-dark"
          >
            Read-aloud voice
          </label>
          <select
            id="tts-voice"
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="mt-2 w-full min-h-[48px] rounded-xl border border-primary/20 bg-background px-3 py-2 text-foreground focus:border-primary/50 focus:outline focus:outline-2 focus:outline-primary"
          >
            <option value="">Default (server env)</option>
            {voices.map((v) => (
              <option key={v.voice_id} value={v.voice_id}>
                {v.name}
                {v.category ? ` — ${v.category}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="speech-lang"
            className="block text-sm font-medium text-primary-dark"
          >
            Speech language (BCP 47)
          </label>
          <Input
            id="speech-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="en-IE"
            className="mt-2"
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="primary" size="md" loading={loading}>
          Save preferences
        </Button>
        {msg && (
          <p className="text-sm text-primary-dark" role="status">
            {msg}
          </p>
        )}
        {err && (
          <p className="text-sm text-red-700" role="alert">
            {err}
          </p>
        )}
      </form>
    </Card>
  );
}
