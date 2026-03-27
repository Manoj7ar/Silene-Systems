"use client";

import { SpeakAloudButton } from "@/components/voice/SpeakAloudButton";

export function DashboardGreetingSpeak({ text }: { text: string }) {
  return (
    <div className="mt-3">
      <SpeakAloudButton text={text} />
    </div>
  );
}
