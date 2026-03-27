"use client";

import { addMedication, markMedicationTaken } from "@/lib/actions/meds";
import { MedicationReadAloud } from "@/components/voice/MedicationReadAloud";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

type Med = {
  id: string;
  drug_name: string;
  dosage: string | null;
  frequency: string | null;
};

export function MedClient({
  medications,
  takenToday,
}: {
  medications: Med[];
  takenToday: Record<string, boolean>;
}) {
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await addMedication({ drugName, dosage, frequency });
      setDrugName("");
      setDosage("");
      setFrequency("");
      setMsg("Added");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="space-y-8">
      <MedicationReadAloud medications={medications} />
      <Card>
        <h2 className="font-serif text-lg font-semibold text-primary-dark">
          Add medication
        </h2>
        <form onSubmit={(e) => void add(e)} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              required
              placeholder="Name"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
            />
            <Input
              placeholder="Dose"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
            <Input
              placeholder="Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Save
          </Button>
          {msg && (
            <p className="text-sm text-foreground/80" role="status" aria-live="polite">
              {msg}
            </p>
          )}
        </form>
      </Card>

      <ul className="space-y-3">
        {medications.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-3 rounded-xl border border-primary/15 bg-background p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-primary-dark">{m.drug_name}</p>
              <p className="text-sm text-foreground/70">
                {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={takenToday[m.id] === true ? "primary" : "secondary"}
                size="md"
                onClick={() => void markMedicationTaken(m.id, true)}
              >
                Taken today
              </Button>
              <Button
                type="button"
                variant={takenToday[m.id] === false ? "primary" : "secondary"}
                size="md"
                onClick={() => void markMedicationTaken(m.id, false)}
              >
                Missed
              </Button>
            </div>
          </li>
        ))}
        {medications.length === 0 && (
          <p className="text-foreground/60">No medications yet — add one above.</p>
        )}
      </ul>
    </div>
  );
}
