import { PageHeader } from "@/components/ui/PageHeader";
import { SummaryClient } from "./SummaryClient";

export const metadata = {
  title: "Clinic summary | ElderCare Companion",
};

export default function SummaryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prepare for your visit"
        description="Generate a plain-language summary from your last three months of logs. Bring it to your GP or specialist — it does not replace medical advice."
      />
      <SummaryClient />
    </div>
  );
}
