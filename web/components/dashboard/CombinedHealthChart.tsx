"use client";

import type { HealthChartPoint } from "@/lib/dashboard/health-chart";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRIMARY = "#1e6f6a";
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
  series: HealthChartPoint[];
  medicationCount: number;
};

export function CombinedHealthChart({ series, medicationCount }: Props) {
  const hasMood = series.some((p) => p.mood !== null);
  const hasAdherence =
    medicationCount > 0 && series.some((p) => p.adherence !== null);

  if (!hasMood && !hasAdherence) {
    return (
      <p className="mt-4 text-sm text-foreground/60">
        No chart data yet — add a check-in with a mood score, medications, and
        dose marks, or load sample data from the dashboard.
      </p>
    );
  }

  return (
    <div className="mt-4 h-80 w-full rounded-2xl border border-primary/15 bg-background p-4 shadow-[var(--shadow-card)]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="dayLabel"
            tick={{ fontSize: 11, fill: PRIMARY_DARK }}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            yAxisId="mood"
            domain={[1, 5]}
            width={36}
            tick={{ fontSize: 11, fill: PRIMARY_DARK }}
            label={{
              value: "Mood",
              angle: -90,
              position: "insideLeft",
              fill: PRIMARY_DARK,
              fontSize: 11,
            }}
          />
          <YAxis
            yAxisId="adh"
            orientation="right"
            domain={[0, 100]}
            width={40}
            tick={{ fontSize: 11, fill: PRIMARY_DARK }}
            label={{
              value: "%",
              angle: 90,
              position: "insideRight",
              fill: PRIMARY_DARK,
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: PRIMARY_DARK, fontWeight: 600 }}
            formatter={(value, name) => {
              const n = String(name);
              if (value === undefined || value === null) return ["—", n];
              if (n === "Dose adherence %" && typeof value === "number") {
                return [`${value}%`, n];
              }
              return [value as string | number, n];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
          />
          {hasMood && (
            <Line
              yAxisId="mood"
              type="monotone"
              dataKey="mood"
              name="Mood (1–5)"
              stroke={PRIMARY}
              strokeWidth={2}
              dot={{ fill: PRIMARY, r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
          {hasAdherence && (
            <Line
              yAxisId="adh"
              type="monotone"
              dataKey="adherence"
              name="Dose adherence %"
              stroke={PRIMARY_DARK}
              strokeWidth={2}
              dot={{ fill: PRIMARY_DARK, r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
