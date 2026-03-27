"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";
  const queryError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message);
        return;
      }
      router.push(next.startsWith("/") ? next : "/app");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const bannerError =
    error ||
    (queryError === "callback"
      ? "That sign-in link expired or is invalid. Request a new one or sign in below."
      : null);

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      {bannerError && (
        <p
          className="rounded-xl border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {bannerError}
        </p>
      )}
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-foreground/90">
          Email
        </label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-foreground/90">
          Password
        </label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
        Sign in
      </Button>
      <p className="text-center text-sm text-foreground/70">
        <Link
          href="/auth/forgot-password"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Forgot password?
        </Link>
      </p>
      <p className="text-center text-sm text-foreground/70">
        No account?{" "}
        <Link
          href={`/auth/signup${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
