"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Role = "patient" | "carer";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim() || undefined,
            role,
          },
          emailRedirectTo,
        },
      });
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        router.push(next.startsWith("/") ? next : "/app");
        router.refresh();
        return;
      }
      setVerifyEmail(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (verifyEmail) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-foreground/85 leading-relaxed">
          Check your inbox for a confirmation link. After you verify your email,
          you can sign in.
        </p>
        <Link
          href="/auth/login"
          className="inline-block font-medium text-primary underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      {error && (
        <p
          className="rounded-xl border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </p>
      )}
      <div>
        <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-foreground/90">
          Name (optional)
        </label>
        <Input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-foreground/90">
          Email
        </label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground/90">
          Account type
        </span>
        <div className="flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/20 bg-background px-4 py-3 text-sm has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="role"
              value="patient"
              checked={role === "patient"}
              onChange={() => setRole("patient")}
              className="size-4 accent-primary"
            />
            Patient
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/20 bg-background px-4 py-3 text-sm has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="role"
              value="carer"
              checked={role === "carer"}
              onChange={() => setRole("carer")}
              className="size-4 accent-primary"
            />
            Family / carer
          </label>
        </div>
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-foreground/90">
          Password
        </label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs text-foreground/55">At least 6 characters.</p>
      </div>
      <div>
        <label htmlFor="signup-confirm" className="mb-1.5 block text-sm font-medium text-foreground/90">
          Confirm password
        </label>
        <Input
          id="signup-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
        Create account
      </Button>
      <p className="text-center text-sm text-foreground/70">
        Already have an account?{" "}
        <Link
          href={`/auth/login${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
