import { Card } from "@/components/ui/Card";
import type { DashboardStats } from "@/lib/dashboard/analytics";

export function DashboardStatsStrip({ stats }: { stats: DashboardStats }) {
  const mood =
    stats.avgMood7d != null ? `${stats.avgMood7d} / 5` : "—";
  const adh =
    stats.adherence7dPct != null ? `${stats.adherence7dPct}%` : "—";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-primary/15 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
          Avg mood (7 days)
        </p>
        <p className="mt-1 font-serif text-2xl font-semibold text-primary-dark">
          {mood}
        </p>
        <p className="mt-1 text-xs text-foreground/55">From daily check-ins.</p>
      </Card>
      <Card className="border-primary/15 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
          Avg adherence (7 days)
        </p>
        <p className="mt-1 font-serif text-2xl font-semibold text-primary-dark">
          {adh}
        </p>
        <p className="mt-1 text-xs text-foreground/55">
          Doses marked taken ÷ medications.
        </p>
      </Card>
      <Card className="border-primary/15 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
          Check-ins (30 days)
        </p>
        <p className="mt-1 font-serif text-2xl font-semibold text-primary-dark">
          {stats.checkIns30d}
        </p>
        <p className="mt-1 text-xs text-foreground/55">Days with a saved log.</p>
      </Card>
      <Card className="border-primary/15 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
          Upcoming visits
        </p>
        <p className="mt-1 font-serif text-2xl font-semibold text-primary-dark">
          {stats.upcomingApptCount}
        </p>
        <p className="mt-1 text-xs text-foreground/55">Scheduled from today.</p>
      </Card>
    </div>
  );
}
