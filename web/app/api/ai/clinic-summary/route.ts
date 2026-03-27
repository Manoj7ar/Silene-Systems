import { createClient } from "@/lib/supabase/server";
import { runAiPrompt } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({
      summary:
        "[Demo] Clinic summaries are generated from your saved check-ins and medications when a user session is present. This is not medical advice.",
    });
  }

  const since = new Date();
  since.setMonth(since.getMonth() - 3);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("log_date, symptoms, mood, mood_rating, vitals, notes")
    .eq("user_id", user.id)
    .gte("log_date", sinceStr)
    .order("log_date", { ascending: true });

  const { data: meds } = await supabase
    .from("medications")
    .select("drug_name, dosage, frequency")
    .eq("user_id", user.id);

  const { data: events } = await supabase
    .from("medication_events")
    .select("event_date, taken, medication_id")
    .eq("user_id", user.id)
    .gte("event_date", sinceStr);

  const payload = JSON.stringify(
    { logs: logs ?? [], medications: meds ?? [], adherence: events ?? [] },
    null,
    2
  );

  const summary = await runAiPrompt(
    `You prepare a concise, factual clinic visit handout for a clinician. No diagnosis. Bullet-friendly plain text with sections: Overview, Symptoms & mood trend, Medication list, Adherence notes, Questions for the doctor.
The patient will print this — keep it respectful and under 600 words.`,
    `Patient self-reported data (last ~3 months):\n\n${payload}`
  );

  return NextResponse.json({ summary });
}
