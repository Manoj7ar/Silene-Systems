import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildFourWeekCheckInBuckets,
  buildUpcomingAppointmentsByWeek,
  computeDashboardStats,
} from "@/lib/dashboard/analytics";
import { buildHealthChartSeries } from "@/lib/dashboard/health-chart";

/** Compact snapshot of dashboard data for AI voice / chat (refreshed on each API call). */
export type DashboardAiContext = {
  generatedAt: string;
  profileName: string | null;
  riskLabel: string;
  medicationCount: number;
  medicationNames: string[];
  missedDosesToday: number;
  stats: {
    avgMood7d: number | null;
    adherence7dPct: number | null;
    checkIns30d: number;
    upcomingApptCount: number;
  };
  weeklyCheckIns: { label: string; count: number }[];
  upcomingAppointmentsByWeek: { label: string; count: number }[];
  recentAlerts: { severity: string; description: string }[];
  moodTrendSample: { date: string; mood: number | null }[];
  recentLogs: { date: string; mood: number | null; symptoms: string | null }[];
  upcomingAppointmentsList: { title: string; whenIso: string }[];
};

export async function fetchDashboardAiContext(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardAiContext> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();

  const start = new Date();
  start.setDate(start.getDate() - 29);
  const startStr = start.toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("log_date, mood_rating, symptoms")
    .eq("user_id", userId)
    .gte("log_date", startStr)
    .order("log_date", { ascending: true });

  const { data: events30 } = await supabase
    .from("medication_events")
    .select("event_date, taken")
    .eq("user_id", userId)
    .gte("event_date", startStr);

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, description, severity, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: meds } = await supabase
    .from("medications")
    .select("id, drug_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const { data: upcomingAppts } = await supabase
    .from("appointments")
    .select("appt_at, title")
    .eq("user_id", userId)
    .gte("appt_at", new Date().toISOString())
    .order("appt_at", { ascending: true })
    .limit(80);

  const medCount = meds?.length ?? 0;
  const chartSeries = buildHealthChartSeries(
    (logs ?? []).map((l) => ({
      log_date: l.log_date,
      mood_rating: l.mood_rating,
    })),
    events30 ?? [],
    medCount
  );

  const stats = computeDashboardStats(
    (logs ?? []).map((l) => ({
      log_date: l.log_date,
      mood_rating: l.mood_rating,
    })),
    events30 ?? [],
    medCount,
    upcomingAppts ?? []
  );

  const checkInsByWeek = buildFourWeekCheckInBuckets(logs ?? []);
  const appointmentsByWeek = buildUpcomingAppointmentsByWeek(
    upcomingAppts ?? []
  );

  const today = new Date().toISOString().slice(0, 10);
  const { data: missedToday } = await supabase
    .from("medication_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_date", today)
    .eq("taken", false);

  const riskLabel =
    (alerts?.some((a) => a.severity === "urgent") && "High") ||
    (alerts?.some((a) => a.severity === "watch") && "Moderate") ||
    "Low";

  const moodTrendSample = chartSeries.slice(-14).map((p) => ({
    date: p.sortKey,
    mood: p.mood,
  }));

  const recentLogs = [...(logs ?? [])]
    .sort((a, b) => b.log_date.localeCompare(a.log_date))
    .slice(0, 10)
    .map((l) => ({
      date: l.log_date,
      mood: l.mood_rating,
      symptoms: l.symptoms,
    }));

  const upcomingAppointmentsList = (upcomingAppts ?? []).slice(0, 12).map(
    (a) => ({
      title: a.title,
      whenIso: a.appt_at,
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    profileName: profile?.name ?? null,
    riskLabel,
    medicationCount: medCount,
    medicationNames: (meds ?? [])
      .map((m) => m.drug_name)
      .filter((n): n is string => Boolean(n?.trim())),
    missedDosesToday: missedToday?.length ?? 0,
    stats: {
      avgMood7d: stats.avgMood7d,
      adherence7dPct: stats.adherence7dPct,
      checkIns30d: stats.checkIns30d,
      upcomingApptCount: stats.upcomingApptCount,
    },
    weeklyCheckIns: checkInsByWeek,
    upcomingAppointmentsByWeek: appointmentsByWeek,
    recentAlerts: (alerts ?? []).map((a) => ({
      severity: a.severity,
      description: a.description,
    })),
    moodTrendSample,
    recentLogs,
    upcomingAppointmentsList,
  };
}
