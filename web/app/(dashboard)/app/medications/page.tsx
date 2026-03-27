import { SignedOutNotice } from "@/components/SignedOutNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { MedClient } from "./MedClient";

export default async function MedicationsPage() {
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

  const { data: medications } = await supabase
    .from("medications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const ids = (medications ?? []).map((m) => m.id);
  const { data: events } =
    ids.length > 0
      ? await supabase
          .from("medication_events")
          .select("medication_id, taken")
          .eq("user_id", user.id)
          .eq("event_date", today)
          .in("medication_id", ids)
      : { data: [] };

  const takenMap = new Map(
    (events ?? []).map((e) => [e.medication_id, e.taken])
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Medications"
        description="Track what you take and mark doses so your dashboard stays accurate."
      />
      <MedClient
        medications={medications ?? []}
        takenToday={Object.fromEntries(takenMap)}
      />
    </div>
  );
}
