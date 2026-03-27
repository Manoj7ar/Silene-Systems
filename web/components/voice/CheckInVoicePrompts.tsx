"use client";

import { SpeakAloudButton } from "@/components/voice/SpeakAloudButton";

const PROMPT_TEXT = [
  "How are you feeling today? Use a few words if you like.",
  "Then choose a mood score from one to five.",
  "Next, note any pain, dizziness, or shortness of breath.",
  "You can add other notes, then save your check-in.",
].join(" ");

export function CheckInVoicePrompts() {
  return (
    <div className="rounded-2xl border border-primary/15 bg-surface-alt p-4 shadow-[var(--shadow-card)]">
      <p className="text-sm font-medium text-primary-dark">Hear the questions</p>
      <p className="mt-1 text-sm text-foreground/70">
        Listen to what this check-in will ask before you answer.
      </p>
      <SpeakAloudButton text={PROMPT_TEXT} className="mt-3" />
    </div>
  );
}
