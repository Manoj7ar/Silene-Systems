import { SignedOutNotice } from "@/components/SignedOutNotice";
import { AppointmentsReadAloud } from "@/components/voice/AppointmentsReadAloud";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { ApptForm } from "./ApptForm";

export default async function AppointmentsPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return (
      <p className="text-foreground/70">
        Configure Supabase environment variables to load this page.
      </p>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <SignedOutNotice />;

  const { data: rows } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .gte("appt_at", new Date().toISOString())
    .order("appt_at", { ascending: true });

  const readAloudText = (rows ?? [])
    .slice(0, 10)
    .map((a) => {
      const when = new Date(a.appt_at).toLocaleString();
      const loc = a.location ? ` at ${a.location}` : "";
      const n = a.notes ? ` Notes: ${a.notes}` : "";
      return `${a.title}, ${when}${loc}.${n}`;
    })
    .join(" ");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Appointments"
        description="Add upcoming visits so you have them in one place before clinic day."
      />
      <AppointmentsReadAloud text={readAloudText} />
      <ApptForm />
      <ul className="space-y-3">
        {(rows ?? []).map((a) => (
          <li
            key={a.id}
            className="rounded-xl border border-primary/15 bg-surface-alt px-4 py-3 shadow-[var(--shadow-card)]"
          >
            <p className="font-semibold text-primary-dark">{a.title}</p>
            <p className="text-sm text-foreground/70">
              {new Date(a.appt_at).toLocaleString()}
              {a.location ? ` · ${a.location}` : ""}
            </p>
            {a.notes && (
              <p className="mt-1 text-sm text-foreground/60">{a.notes}</p>
            )}
          </li>
        ))}
        {(rows ?? []).length === 0 && (
          <p className="text-foreground/60">No upcoming visits scheduled.</p>
        )}
      </ul>
    </div>
  );
}
