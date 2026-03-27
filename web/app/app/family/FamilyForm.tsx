"use client";

import { addFamilyLink } from "@/app/actions/family";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

export function FamilyForm() {
  const [carerId, setCarerId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await addFamilyLink(carerId.trim());
      setCarerId("");
      setMsg("Linked (if the ID was valid and unique).");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not link");
    }
  }

  return (
    <Card>
      <form
        onSubmit={(e) => void submit(e)}
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="carer" className="text-sm font-medium text-primary-dark">
            Carer user ID (UUID)
          </label>
          <Input
            id="carer"
            required
            value={carerId}
            onChange={(e) => setCarerId(e.target.value)}
            className="mt-1 font-mono text-sm"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>
        <Button type="submit" variant="primary" size="md" className="shrink-0">
          Add link
        </Button>
      </form>
      {msg && (
        <p
          className="mt-3 text-sm text-foreground/80 sm:col-span-2"
          role="status"
          aria-live="polite"
        >
          {msg}
        </p>
      )}
    </Card>
  );
}
