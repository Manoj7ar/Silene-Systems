"use client";

import { SpeakAloudButton } from "@/components/voice/SpeakAloudButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useState } from "react";

export function AiInsights() {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/insights", { method: "POST" });
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as { insight: string };
      setText(data.insight);
    } catch {
      setText("Could not load insights.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-serif text-xl font-semibold text-primary-dark">
        AI pattern note
      </h2>
      <p className="mt-1 text-sm text-foreground/60">
        Optional — uses your recent logs. Not medical advice.
      </p>
      <Button
        type="button"
        variant="primary"
        size="md"
        loading={loading}
        onClick={() => void load()}
        className="mt-4"
      >
        {loading ? "Refreshing…" : "Refresh insight"}
      </Button>
      {text && (
        <>
          <p
            className="mt-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap"
            role="status"
            aria-live="polite"
          >
            {text}
          </p>
          <SpeakAloudButton text={text} className="mt-3" />
        </>
      )}
    </Card>
  );
}
