"use client";

import { SpeakAloudButton } from "@/components/voice/SpeakAloudButton";

export function AppointmentsReadAloud({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="rounded-2xl border border-primary/15 bg-surface-alt p-4 shadow-[var(--shadow-card)]">
      <p className="text-sm font-medium text-primary-dark">Hear upcoming visits</p>
      <SpeakAloudButton text={text} className="mt-3" />
    </div>
  );
}
