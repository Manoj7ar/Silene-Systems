"use client";

import { addAppointment } from "@/app/actions/appointments";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

export function ApptForm() {
  const [title, setTitle] = useState("");
  const [apptAt, setApptAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await addAppointment({
        title,
        apptAt: new Date(apptAt).toISOString(),
        location,
        notes,
      });
      setTitle("");
      setApptAt("");
      setLocation("");
      setNotes("");
      setMsg("Saved");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <Card>
      <h2 className="font-serif text-lg font-semibold text-primary-dark">
        Add appointment
      </h2>
      <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            required
            placeholder="Visit title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            required
            type="datetime-local"
            value={apptAt}
            onChange={(e) => setApptAt(e.target.value)}
          />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Input
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button type="submit" variant="primary" size="md">
          Save
        </Button>
        {msg && (
          <p className="text-sm text-foreground/80" role="status" aria-live="polite">
            {msg}
          </p>
        )}
      </form>
    </Card>
  );
}
