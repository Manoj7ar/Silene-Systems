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
      insight:
        "[Demo] Personalized insights need a Supabase user session with saved logs. This is not medical advice.",
    });
  }

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("log_date, symptoms, mood, mood_rating, notes")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false })
    .limit(21);

  const { data: events } = await supabase
    .from("medication_events")
    .select("event_date, taken, medication_id")
    .eq("user_id", user.id)
    .order("event_date", { ascending: false })
    .limit(30);

  const payload = JSON.stringify({ logs: logs ?? [], medEvents: events ?? [] }, null, 2);

  const text = await runAiPrompt(
    `You are a supportive assistant helping older adults understand patterns in their self-reported health logs.
Never diagnose or prescribe. Use plain language. If something might need medical attention, urge speaking to a GP or nurse.
Keep the response under 400 words.`,
    `Here is recent JSON data for one user (symptoms, mood, medication adherence). Summarize trends and one or two gentle observations:\n\n${payload}`
  );

  return NextResponse.json({ insight: text });
}
