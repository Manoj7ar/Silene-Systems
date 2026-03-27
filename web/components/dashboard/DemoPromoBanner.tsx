import { DemoDataButton } from "@/components/dashboard/DemoDataButton";
import { Card } from "@/components/ui/Card";

/** Shown when the account has no logs and no meds — encourages one-click demo data. */
export function DemoPromoBanner() {
  return (
    <Card className="border-2 border-primary/25 bg-primary/[0.06] p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-primary-dark">
            Demo this dashboard
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground/80 leading-relaxed">
            Load sample check-ins, medications, dose history, appointments, and
            alerts so charts and lists fill in for a screen recording or walkthrough.
            (This replaces your current logs, meds, appointments, and alerts for
            this account — use when you want a full demo dataset.)
          </p>
          <p className="mt-2 text-xs text-foreground/55">
            Tip: set <code className="rounded bg-primary/10 px-1 font-mono">DEMO_AUTO_SEED=1</code>{" "}
            in <code className="font-mono">web/.env.local</code> to auto-fill on first visit
            when the account is empty.
          </p>
        </div>
        <div className="shrink-0 sm:pt-1">
          <DemoDataButton />
        </div>
      </div>
    </Card>
  );
}
