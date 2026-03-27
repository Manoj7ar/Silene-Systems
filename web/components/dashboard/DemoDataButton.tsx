"use client";

import { seedDemoData } from "@/lib/actions/demo";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoDataButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadDemo() {
    const ok = window.confirm(
      "Replace your current daily logs, medications, dose history, appointments, and alerts with sample data? This cannot be undone."
    );
    if (!ok) return;

    setLoading(true);
    setMessage(null);
    const result = await seedDemoData();
    setLoading(false);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("Sample data loaded. Charts and lists will update.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="md"
        loading={loading}
        onClick={() => void loadDemo()}
      >
        Load sample data
      </Button>
      {message && (
        <p className="text-sm text-foreground/75" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
