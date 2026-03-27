"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveDailyLog(input: {
  symptoms: string;
  mood: string;
  moodRating: number | null;
  notes: string;
  voiceTranscript: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Could not save — no user session.");
  }

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      log_date: today,
      symptoms: input.symptoms || null,
      mood: input.mood || null,
      mood_rating: input.moodRating,
      notes: input.notes || null,
      voice_transcript: input.voiceTranscript || null,
    },
    { onConflict: "user_id,log_date" }
  );

  if (error) throw error;

  await maybeCreateAlert(supabase, user.id, input);

  revalidatePath("/app");
  revalidatePath("/app/check-in");
}

async function maybeCreateAlert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: { moodRating: number | null; symptoms: string }
): Promise<void> {
  const lowMood =
    input.moodRating !== null && input.moodRating <= 2;
  const worrisomeSymptom =
    /\b(fell|fall|chest\s*pain|breathless|dizzy|999|112|emergency)\b/i.test(
      `${input.symptoms} ${input.moodRating ?? ""}`
    );

  if (lowMood) {
    await supabase.from("alerts").insert({
      user_id: userId,
      type: "mood",
      description:
        "Low mood logged recently. Consider a gentle check-in and speaking with your GP if this continues.",
      severity: "watch",
      sent_to_family: false,
    });
  }

  if (worrisomeSymptom) {
    await supabase.from("alerts").insert({
      user_id: userId,
      type: "symptom",
      description:
        "You logged something that may need prompt medical attention. This is not a diagnosis — contact your GP or emergency services if you are concerned.",
      severity: "urgent",
      sent_to_family: false,
    });
  }
}
