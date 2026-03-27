"use client";

import type { WeekBucket } from "@/lib/dashboard/analytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRIMARY = "#1e6f6a";
const PRIMARY_MUTED = "rgb(30 111 106 / 0.35)";
const PRIMARY_DARK = "#134540";
const GRID = "rgb(30 111 106 / 0.12)";

const tooltipStyle = {
  backgroundColor: "var(--color-surface-alt)",
  border: "1px solid rgb(30 111 106 / 0.2)",
  borderRadius: "12px",
  padding: "10px 12px",
  fontSize: "13px",
  boxShadow: "var(--shadow-card-hover)",
};

type Props = {
  checkInsByWeek: WeekBucket[];
  appointmentsByWeek: WeekBucket[];
};

export function DashboardBarCharts({
  checkInsByWeek,
  appointmentsByWeek,
}: Props) {
  const hasCheckIns = checkInsByWeek.some((b) => b.count > 0);
  const hasAppts = appointmentsByWeek.some((b) => b.count > 0);

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-primary/15 bg-background p-4 shadow-[var(--shadow-card)]">
        <h3 className="font-serif text-lg font-semibold text-primary-dark">
          Check-ins by week
        </h3>
        <p className="mt-1 text-xs text-foreground/60">
          Number of days you logged a check-in in each 7-day window.
        </p>
        <div className="mt-3 h-56 w-full">
          {!hasCheckIns ? (
            <p className="text-sm text-foreground/55">No check-in history in this range yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={checkInsByWeek}
                margin={{ top: 8, right: 8, left: 0, bottom: 32 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: PRIMARY_DARK }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={48}
                />
                <YAxis
                  allowDecimals={false}
                  width={28}
                  tick={{ fontSize: 11, fill: PRIMARY_DARK }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="count"
                  name="Days with check-in"
                  fill={PRIMARY}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-background p-4 shadow-[var(--shadow-card)]">
        <h3 className="font-serif text-lg font-semibold text-primary-dark">
          Upcoming visits by week
        </h3>
        <p className="mt-1 text-xs text-foreground/60">
          Scheduled appointments in the next six weeks.
        </p>
        <div className="mt-3 h-56 w-full">
          {!hasAppts ? (
            <p className="text-sm text-foreground/55">
              No upcoming visits — add appointments to see them here.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={appointmentsByWeek}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: PRIMARY_DARK }}
                />
                <YAxis
                  allowDecimals={false}
                  width={28}
                  tick={{ fontSize: 11, fill: PRIMARY_DARK }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="count"
                  name="Appointments"
                  fill={PRIMARY_MUTED}
                  stroke={PRIMARY}
                  strokeWidth={1}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
