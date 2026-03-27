"use server";

import {
  buildDemoAdherencePattern,
  buildDemoAlerts,
  buildDemoAppointments,
  buildDemoDailyLogs,
  DEMO_MEDICATIONS,
  recentDates,
} from "@/lib/demo-seed";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Replaces existing demo-related rows for the current user with sample data
 * (daily logs, medications, events, appointments, alerts).
 */
export async function seedDemoData(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to load sample data." };

  const uid = user.id;

  const { error: delEvents } = await supabase
    .from("medication_events")
    .delete()
    .eq("user_id", uid);
  if (delEvents) return { ok: false, error: delEvents.message };

  const { error: delMeds } = await supabase
    .from("medications")
    .delete()
    .eq("user_id", uid);
  if (delMeds) return { ok: false, error: delMeds.message };

  const { error: delLogs } = await supabase
    .from("daily_logs")
    .delete()
    .eq("user_id", uid);
  if (delLogs) return { ok: false, error: delLogs.message };

  const { error: delAppt } = await supabase
    .from("appointments")
    .delete()
    .eq("user_id", uid);
  if (delAppt) return { ok: false, error: delAppt.message };

  const { error: delAlerts } = await supabase
    .from("alerts")
    .delete()
    .eq("user_id", uid);
  if (delAlerts) return { ok: false, error: delAlerts.message };

  const dailyLogs = buildDemoDailyLogs();
  const { error: insLogs } = await supabase.from("daily_logs").insert(
    dailyLogs.map((row) => ({
      user_id: uid,
      log_date: row.log_date,
      symptoms: row.symptoms,
      mood: row.mood,
      mood_rating: row.mood_rating,
      notes: row.notes,
      vitals: {},
    }))
  );
  if (insLogs) return { ok: false, error: insLogs.message };

  const { data: insertedMeds, error: insMeds } = await supabase
    .from("medications")
    .insert(
      DEMO_MEDICATIONS.map((m) => ({
        user_id: uid,
        drug_name: m.drug_name,
        dosage: m.dosage,
        frequency: m.frequency,
        schedule: {},
      }))
    )
    .select("id");
  if (insMeds) return { ok: false, error: insMeds.message };
  const medIds = (insertedMeds ?? []).map((m) => m.id);
  if (medIds.length === 0)
    return { ok: false, error: "Could not create demo medications." };

  const last14 = recentDates(14);
  const pattern = buildDemoAdherencePattern(last14, medIds.length);

  const events: {
    medication_id: string;
    user_id: string;
    event_date: string;
    taken: boolean;
  }[] = [];

  last14.forEach((event_date, dayIdx) => {
    medIds.forEach((medication_id, medIdx) => {
      events.push({
        medication_id,
        user_id: uid,
        event_date,
        taken: pattern[dayIdx]?.[medIdx] ?? false,
      });
    });
  });

  const { error: insEv } = await supabase.from("medication_events").insert(events);
  if (insEv) return { ok: false, error: insEv.message };

  const appts = buildDemoAppointments();
  const { error: insAp } = await supabase.from("appointments").insert(
    appts.map((a) => ({
      user_id: uid,
      title: a.title,
      appt_at: a.appt_at,
      location: a.location,
      notes: a.notes,
    }))
  );
  if (insAp) return { ok: false, error: insAp.message };

  const alerts = buildDemoAlerts();
  const { error: insAl } = await supabase.from("alerts").insert(
    alerts.map((a) => ({
      user_id: uid,
      type: a.type,
      description: a.description,
      severity: a.severity,
      sent_to_family: false,
    }))
  );
  if (insAl) return { ok: false, error: insAl.message };

  revalidatePath("/app");
  revalidatePath("/app/check-in");
  revalidatePath("/app/medications");
  revalidatePath("/app/appointments");
  revalidatePath("/app/summary");

  return { ok: true };
}

/**
 * Loads the same sample data as {@link seedDemoData} only when the user has
 * **no** daily logs and **no** medications — safe for first-time demo / `DEMO_AUTO_SEED`.
 */
export async function seedDemoDataIfEmpty(): Promise<
  { ok: true; seeded: boolean } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to load sample data." };

  const { count: logCount } = await supabase
    .from("daily_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: medCount } = await supabase
    .from("medications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((logCount ?? 0) > 0 || (medCount ?? 0) > 0) {
    return { ok: true, seeded: false };
  }

  const r = await seedDemoData();
  if (!r.ok) return r;
  return { ok: true, seeded: true };
}
