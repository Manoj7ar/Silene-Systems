import { SignedOutNotice } from "@/components/SignedOutNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { FamilyForm } from "./FamilyForm";

export default async function FamilyPage() {
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

  const { data: links } = await supabase
    .from("family_links")
    .select("id, carer_id, created_at")
    .eq("patient_id", user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Family & carers"
        description={
          <>
            Add a trusted contact who already has an ElderCare account. Paste their
            user ID from their profile (MVP). They will see trends and alerts you
            allow — not full raw notes unless you enable it later.
          </>
        }
      />
      <FamilyForm />
      <ul className="space-y-2">
        {(links ?? []).map((l) => (
          <li
            key={l.id}
            className="rounded-lg border border-primary/15 bg-surface-alt px-4 py-2 text-sm shadow-[var(--shadow-card)]"
          >
            Carer user ID: <code className="font-mono">{l.carer_id}</code>
          </li>
        ))}
        {(links ?? []).length === 0 && (
          <p className="text-foreground/60">No linked carers yet.</p>
        )}
      </ul>
    </div>
  );
}
