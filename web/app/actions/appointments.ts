"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAppointment(form: {
  title: string;
  apptAt: string;
  location: string;
  notes: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not save — no user session.");

  const { error } = await supabase.from("appointments").insert({
    user_id: user.id,
    title: form.title,
    appt_at: form.apptAt,
    location: form.location || null,
    notes: form.notes || null,
  });
  if (error) throw error;
  revalidatePath("/app/appointments");
}
