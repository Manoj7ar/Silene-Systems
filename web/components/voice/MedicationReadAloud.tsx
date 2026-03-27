"use client";

import { SpeakAloudButton } from "@/components/voice/SpeakAloudButton";

type Med = {
  drug_name: string;
  dosage: string | null;
  frequency: string | null;
};

export function MedicationReadAloud({ medications }: { medications: Med[] }) {
  if (medications.length === 0) return null;

  const text = medications
    .map((m) => {
      const bits = [m.drug_name, m.dosage, m.frequency].filter(Boolean);
      return bits.join(", ");
    })
    .join(". ");

  const intro = "Your medications: ";
  return (
    <div className="rounded-2xl border border-primary/15 bg-surface-alt p-4 shadow-[var(--shadow-card)]">
      <p className="text-sm font-medium text-primary-dark">Read my list</p>
      <SpeakAloudButton text={intro + text} className="mt-3" />
    </div>
  );
}
