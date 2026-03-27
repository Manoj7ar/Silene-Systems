import { AiInsights } from "@/components/AiInsights";
import { CombinedHealthChart } from "@/components/dashboard/CombinedHealthChart";
import { DashboardBarCharts } from "@/components/dashboard/DashboardBarCharts";
import { DashboardStatsStrip } from "@/components/dashboard/DashboardStatsStrip";
import { seedDemoDataIfEmpty } from "@/app/actions/demo";
import { DemoDataButton } from "@/components/dashboard/DemoDataButton";
import { DemoPromoBanner } from "@/components/dashboard/DemoPromoBanner";
import { SignedOutNotice } from "@/components/SignedOutNotice";
import { DashboardVoiceAssistant } from "@/components/voice/DashboardVoiceAssistant";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  buildFourWeekCheckInBuckets,
  buildUpcomingAppointmentsByWeek,
  computeDashboardStats,
} from "@/lib/dashboard-analytics";
import { buildHealthChartSeries } from "@/lib/health-chart";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function severityBadgeClass(severity: string) {
  if (severity === "urgent")
    return "border-red-600/40 bg-red-50 text-red-900";
  if (severity === "watch")
    return "border-amber-600/35 bg-amber-50 text-amber-950";
  return "border-primary/25 bg-primary/5 text-primary-dark";
}

export default async function DashboardPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return (
      <p className="text-foreground/70">
        Configure Supabase environment variables to load your dashboard.
      </p>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <SignedOutNotice />;

  const demoAuto =
    process.env.DEMO_AUTO_SEED === "1" ||
    process.env.DEMO_AUTO_SEED === "true";
  if (demoAuto) {
    await seedDemoDataIfEmpty();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const start = new Date();
  start.setDate(start.getDate() - 29);
  const startStr = start.toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("log_date, mood_rating, symptoms")
    .eq("user_id", user.id)
    .gte("log_date", startStr)
    .order("log_date", { ascending: true });

  const { data: events30 } = await supabase
    .from("medication_events")
    .select("event_date, taken")
    .eq("user_id", user.id)
    .gte("event_date", startStr);

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, description, severity, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: meds } = await supabase
    .from("medications")
    .select("id")
    .eq("user_id", user.id);

  const { data: upcomingAppts } = await supabase
    .from("appointments")
    .select("appt_at, title")
    .eq("user_id", user.id)
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
    .eq("user_id", user.id)
    .eq("event_date", today)
    .eq("taken", false);

  const riskLabel =
    (alerts?.some((a) => a.severity === "urgent") && "High") ||
    (alerts?.some((a) => a.severity === "watch") && "Moderate") ||
    "Low";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-primary-dark">
          Hello{profile?.name ? `, ${profile.name}` : ""}
        </h1>
        <p className="mt-1 text-foreground/70">
          Your week at a glance — check in daily for the best insights.
        </p>
        <DashboardVoiceAssistant />
      </div>

      {(logs ?? []).length === 0 && medCount === 0 && <DemoPromoBanner />}

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary-dark">
          Snapshot
        </h2>
        <p className="mt-1 text-sm text-foreground/65">
          Rolling averages and counts from your logged data.
        </p>
        <div className="mt-4">
          <DashboardStatsStrip stats={stats} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
            Risk level (informal)
          </p>
          <p className="mt-2 font-serif text-2xl font-semibold text-primary-dark">
            {riskLabel}
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            Not medical advice — based on patterns you logged.
          </p>
        </Card>
        <Card hover>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
            Medications
          </p>
          <p className="mt-2 font-serif text-2xl font-semibold text-primary-dark">
            {medCount}
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            {missedToday && missedToday.length > 0
              ? "Some doses marked not taken today"
              : "Keep tracking adherence"}
          </p>
        </Card>
        <Card hover>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
            Quick actions
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/app/check-in"
                className={buttonClassName({ variant: "primary", size: "md" })}
              >
                Daily check-in
              </Link>
              <Link
                href="/app/summary"
                className={buttonClassName({
                  variant: "secondary",
                  size: "md",
                })}
              >
                Clinic summary
              </Link>
            </div>
            <DemoDataButton />
          </div>
        </Card>
      </div>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary-dark">
          Health overview (last 30 days)
        </h2>
        <p className="mt-1 text-sm text-foreground/65">
          Mood (1–5) and dose adherence — share of today&apos;s medications
          marked taken on each day.
        </p>
        <CombinedHealthChart
          series={chartSeries}
          medicationCount={medCount}
        />
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary-dark">
          Activity & appointments
        </h2>
        <p className="mt-1 text-sm text-foreground/65">
          Weekly check-in cadence and how visits are spread over the next few weeks.
        </p>
        <DashboardBarCharts
          checkInsByWeek={checkInsByWeek}
          appointmentsByWeek={appointmentsByWeek}
        />
      </section>

      {alerts && alerts.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold text-primary-dark">
            Recent alerts
          </h2>
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-2 rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:gap-3"
              >
                <span
                  className={`inline-flex w-fit shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${severityBadgeClass(a.severity)}`}
                >
                  {a.severity}
                </span>
                <span className="text-foreground/90">{a.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AiInsights />

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary-dark">
          Mood & symptoms (recent logs)
        </h2>
        <p className="mt-1 text-sm text-foreground/65">
          Latest entries from your daily check-ins.
        </p>
        <ul className="mt-4 space-y-2">
          {(logs ?? []).length === 0 ? (
            <li className="text-sm text-foreground/60">
              No logs in the last 30 days yet.
            </li>
          ) : (
            [...(logs ?? [])]
              .sort((a, b) => b.log_date.localeCompare(a.log_date))
              .slice(0, 8)
              .map((l) => (
                <li
                  key={l.log_date}
                  className="rounded-xl border border-primary/15 bg-surface-alt px-4 py-3 text-sm shadow-[var(--shadow-card)]"
                >
                  <span className="font-semibold text-primary-dark">
                    {l.log_date}
                  </span>
                  {l.mood_rating != null && (
                    <span className="ml-2 text-foreground/70">
                      Mood {l.mood_rating}/5
                    </span>
                  )}
                  {l.symptoms && (
                    <p className="mt-1 text-foreground/85">{l.symptoms}</p>
                  )}
                </li>
              ))
          )}
        </ul>
      </section>
    </div>
  );
}
