import { recentDates } from "@/lib/demo/seed";

export type DashboardStats = {
  avgMood7d: number | null;
  adherence7dPct: number | null;
  checkIns30d: number;
  upcomingApptCount: number;
};

export type WeekBucket = { label: string; count: number };

function avgMoodLastDays(
  logs: { log_date: string; mood_rating: number | null }[],
  days: number
): number | null {
  const want = new Set(recentDates(days));
  const ratings = logs
    .filter((l) => want.has(l.log_date) && l.mood_rating != null)
    .map((l) => l.mood_rating as number);
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}

function adherenceLastDays(
  events: { event_date: string; taken: boolean }[],
  medCount: number,
  days: number
): number | null {
  if (medCount <= 0) return null;
  const want = recentDates(days);
  const pcts: number[] = [];
  for (const d of want) {
    const taken = events.filter((e) => e.event_date === d && e.taken).length;
    pcts.push((taken / medCount) * 100);
  }
  if (pcts.length === 0) return null;
  return Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10;
}

export function computeDashboardStats(
  logs: { log_date: string; mood_rating: number | null }[],
  events: { event_date: string; taken: boolean }[],
  medCount: number,
  upcomingAppointments: { appt_at: string }[]
): DashboardStats {
  return {
    avgMood7d: avgMoodLastDays(logs, 7),
    adherence7dPct: adherenceLastDays(events, medCount, 7),
    checkIns30d: logs.filter((l) => recentDates(30).includes(l.log_date)).length,
    upcomingApptCount: upcomingAppointments.length,
  };
}

/** Check-ins per rolling 7-day block for the last 4 weeks (oldest → newest). */
export function buildFourWeekCheckInBuckets(
  logs: { log_date: string }[]
): WeekBucket[] {
  const logDates = new Set(logs.map((l) => l.log_date));
  const labels = [
    "22–28 days ago",
    "15–21 days ago",
    "8–14 days ago",
    "Last 7 days",
  ];
  const out: WeekBucket[] = [];
  for (let w = 0; w < 4; w++) {
    const high = 27 - w * 7;
    const low = high - 6;
    let count = 0;
    for (let d = low; d <= high; d++) {
      const day = new Date();
      day.setHours(12, 0, 0, 0);
      day.setDate(day.getDate() - d);
      const s = day.toISOString().slice(0, 10);
      if (logDates.has(s)) count++;
    }
    out.push({ label: labels[w]!, count });
  }
  return out;
}

/** Upcoming appointments in six rolling 7-day windows from now. */
export function buildUpcomingAppointmentsByWeek(
  appts: { appt_at: string }[]
): WeekBucket[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const counts = [0, 0, 0, 0, 0, 0];

  for (const a of appts) {
    const at = new Date(a.appt_at).getTime();
    if (at < now) continue;
    const idx = Math.min(5, Math.floor((at - now) / weekMs));
    if (idx >= 0 && idx < 6) counts[idx] = (counts[idx] ?? 0) + 1;
  }

  const labels = [
    "Next 7 days",
    "7–14 days",
    "14–21 days",
    "21–28 days",
    "28–35 days",
    "35–42 days",
  ];
  return counts.map((count, i) => ({
    label: labels[i] ?? `Week ${i + 1}`,
    count,
  }));
}
