import Link from "next/link";

/** Shown when Supabase is configured but there is no session (e.g. env missing or edge case). */
export function SignedOutNotice() {
  return (
    <div
      className="rounded-2xl border border-primary/20 bg-surface-alt p-8 shadow-[var(--shadow-card)]"
      role="status"
    >
      <h2 className="font-serif text-xl font-semibold text-primary-dark">
        No account session
      </h2>
      <p className="mt-3 max-w-xl text-foreground/80 leading-relaxed">
        Sign in to save your health data. If Supabase is not configured in this
        environment, add{" "}
        <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-sm">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-sm">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        in{" "}
        <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-sm">
          .env.local
        </code>
        .
      </p>
      <p className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link
          href="/auth/login"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Create account
        </Link>
        <Link
          href="/"
          className="text-foreground/70 underline-offset-2 hover:underline"
        >
          Marketing site
        </Link>
      </p>
    </div>
  );
}
