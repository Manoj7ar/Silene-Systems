"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateVoicePreferences(input: {
  tts_voice_id: string | null;
  speech_language: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const lang = input.speech_language.trim() || "en-IE";
  const voice =
    input.tts_voice_id?.trim() === "" ? null : input.tts_voice_id?.trim() ?? null;

  const { error } = await supabase
    .from("profiles")
    .update({
      tts_voice_id: voice,
      speech_language: lang,
    })
    .eq("id", user.id);

  if (error) throw error;

  revalidatePath("/app/settings");
  revalidatePath("/app");
  revalidatePath("/app/check-in");
}
