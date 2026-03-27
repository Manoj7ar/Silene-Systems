"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMedication(form: {
  drugName: string;
  dosage: string;
  frequency: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not save — no user session.");

  const { error } = await supabase.from("medications").insert({
    user_id: user.id,
    drug_name: form.drugName,
    dosage: form.dosage || null,
    frequency: form.frequency || null,
  });
  if (error) throw error;
  revalidatePath("/app/medications");
}

export async function markMedicationTaken(medicationId: string, taken: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not save — no user session.");

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("medication_events").upsert(
    {
      medication_id: medicationId,
      user_id: user.id,
      event_date: today,
      taken,
    },
    { onConflict: "medication_id,event_date" }
  );
  if (error) throw error;
  revalidatePath("/app/medications");
  revalidatePath("/app");
}
