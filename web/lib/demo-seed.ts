/**
 * Deterministic demo payloads for ElderCare — used by seedDemoData (server action).
 * Keeps charts and lists populated with realistic variety without external services.
 */

export type DemoDailyLog = {
  log_date: string;
  symptoms: string | null;
  mood: string | null;
  mood_rating: number | null;
  notes: string | null;
};

export type DemoMedication = {
  drug_name: string;
  dosage: string;
  frequency: string;
};

export type DemoAppointment = {
  title: string;
  appt_at: string;
  location: string | null;
  notes: string | null;
};

export type DemoAlert = {
  type: string;
  description: string;
  severity: "info" | "watch" | "urgent";
};

/** Last N calendar days as YYYY-MM-DD (today = last index). */
export function recentDates(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const SYMPTOM_ROT = [
  "Slight stiffness in the morning",
  "Energy fair after a short walk",
  "Headache mild, rested in afternoon",
  "Joints comfortable",
  "Appetite good",
  "Sleep was broken once",
  "Breathing fine at rest",
  "No new concerns",
];

const MOOD_LABELS = ["Low", "Okay", "Fair", "Good", "Great"];

function pseudoNoise(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function buildDemoDailyLogs(seed = 42): DemoDailyLog[] {
  const dates = recentDates(30);
  return dates.map((log_date, i) => {
    const n = pseudoNoise(seed, i);
    const mood_rating = Math.max(
      1,
      Math.min(5, Math.round(2 + n * 3.4 + (i % 7 === 0 ? -0.5 : 0)))
    );
    return {
      log_date,
      symptoms: SYMPTOM_ROT[i % SYMPTOM_ROT.length],
      mood: MOOD_LABELS[mood_rating - 1] ?? "Fair",
      mood_rating,
      notes:
        i % 9 === 0
          ? "Short walk with a neighbour today."
          : i % 11 === 0
            ? "Remembered morning water."
            : null,
    };
  });
}

export const DEMO_MEDICATIONS: DemoMedication[] = [
  {
    drug_name: "Atorvastatin",
    dosage: "20 mg",
    frequency: "Once daily with evening meal",
  },
  {
    drug_name: "Metformin",
    dosage: "500 mg",
    frequency: "Twice daily with food",
  },
  {
    drug_name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Once daily in the morning",
  },
];

/** For each date in `dates`, whether each med index was taken (demo adherence pattern). */
export function buildDemoAdherencePattern(
  dates: string[],
  medCount: number,
  seed = 42
): boolean[][] {
  return dates.map((_, dayIdx) =>
    Array.from({ length: medCount }, (_, medIdx) => {
      const p = pseudoNoise(seed, dayIdx * 17 + medIdx * 31);
      return p > 0.12;
    })
  );
}

export function buildDemoAppointments(): DemoAppointment[] {
  const now = new Date();
  const addDays = (d: number) => {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    x.setHours(10 + (d % 3), 30, 0, 0);
    return x.toISOString();
  };
  return [
    {
      title: "GP — medication review",
      appt_at: addDays(5),
      location: "Riverside Medical Centre",
      notes: "Bring current tablet boxes.",
    },
    {
      title: "Physiotherapy",
      appt_at: addDays(12),
      location: "Community clinic",
      notes: null,
    },
    {
      title: "Dental hygienist",
      appt_at: addDays(21),
      location: "Main Street Dental",
      notes: null,
    },
    {
      title: "Eye test",
      appt_at: addDays(35),
      location: "High Street Opticians",
      notes: "Annual check",
    },
  ];
}

export function buildDemoAlerts(): DemoAlert[] {
  return [
    {
      type: "routine",
      description:
        "You have been logging regularly — great for spotting patterns before clinic visits.",
      severity: "info",
    },
    {
      type: "adherence",
      description:
        "A few doses were missed last week. If this continues, mention it to your GP or pharmacist.",
      severity: "watch",
    },
  ];
}
