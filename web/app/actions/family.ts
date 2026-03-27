"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addFamilyLink(carerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not save — no user session.");

  const { error } = await supabase.from("family_links").insert({
    patient_id: user.id,
    carer_id: carerId,
    can_see_notes: false,
    can_see_vitals: true,
  });
  if (error) throw error;
  revalidatePath("/app/family");
}
