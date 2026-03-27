"use client";

import { SpeakAloudButton } from "@/components/voice/SpeakAloudButton";
import { Button } from "@/components/ui/Button";
import {
  parseBoldSegments,
  stripBoldMarkersForSpeech,
} from "@/lib/text/bold-markers";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  pdf,
} from "@react-pdf/renderer";
import { Fragment, useState } from "react";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, lineHeight: 1.5 },
  title: { fontSize: 16, marginBottom: 16, color: "#134540" },
  body: { color: "#1a1a1a", whiteSpace: "pre-wrap" },
  foot: {
    marginTop: 24,
    fontSize: 9,
    color: "#666",
  },
});

function ClinicDoc({ text }: { text: string }) {
  const segments = parseBoldSegments(text);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ElderCare Companion — clinic summary</Text>
        <Text style={styles.body}>
          {segments.map((seg, idx) =>
            seg.bold ? (
              <Text key={idx} style={{ fontWeight: "bold" }}>
                {seg.text}
              </Text>
            ) : (
              <Text key={idx}>{seg.text}</Text>
            )
          )}
        </Text>
        <Text style={styles.foot}>
          Not medical advice. ElderCare Companion — pattern summary only. Discuss
          with your clinician.
        </Text>
      </Page>
    </Document>
  );
}

export function SummaryClient() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/clinic-summary", { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { summary: string };
      setSummary(data.summary);
    } catch {
      setErr("Could not generate summary.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    if (!summary) return;
    const blob = await pdf(<ClinicDoc text={summary} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eldercare-clinic-summary.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={loading}
          onClick={() => void generate()}
        >
          {loading ? "Generating…" : "Generate summary"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={!summary}
          onClick={() => void downloadPdf()}
        >
          Download PDF
        </Button>
      </div>
      {err && (
        <p className="text-sm text-red-700" role="alert">
          {err}
        </p>
      )}
      {summary && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/15 bg-surface-alt p-6 shadow-[var(--shadow-card)]">
            <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {parseBoldSegments(summary).map((seg, i) => (
                <Fragment key={i}>
                  {seg.bold ? (
                    <strong className="font-semibold text-primary-dark">
                      {seg.text}
                    </strong>
                  ) : (
                    seg.text
                  )}
                </Fragment>
              ))}
            </div>
          </div>
          <SpeakAloudButton text={stripBoldMarkersForSpeech(summary)} />
        </div>
      )}
    </div>
  );
}
