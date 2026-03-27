import { recentDates } from "@/lib/demo/seed";

export type HealthChartPoint = {
  dayLabel: string;
  sortKey: string;
  mood: number | null;
  /** 0–100; null when there are no medications to track. */
  adherence: number | null;
};

export function buildHealthChartSeries(
  logs: { log_date: string; mood_rating: number | null }[],
  events: { event_date: string; taken: boolean }[],
  medCount: number
): HealthChartPoint[] {
  const moodMap = new Map(
    logs.map((l) => [l.log_date, l.mood_rating] as const)
  );
  const dates = recentDates(30);

  return dates.map((sortKey) => {
    const dayLabel = sortKey.slice(5);
    const mood = moodMap.get(sortKey) ?? null;
    let adherence: number | null = null;
    if (medCount > 0) {
      const taken = events.filter(
        (e) => e.event_date === sortKey && e.taken
      ).length;
      adherence = Math.round((taken / medCount) * 1000) / 10;
    }
    return { dayLabel, sortKey, mood, adherence };
  });
}
