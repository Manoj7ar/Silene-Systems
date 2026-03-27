import { BackToHome } from "@/components/BackToHome";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const metadata = {
  title: "Get started | ElderCare Companion",
};

const NEXT = "/app";

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <BackToHome />
        <Card className="p-8">
          <h1 className="font-serif text-2xl font-semibold text-primary-dark">
            ElderCare Companion
          </h1>
          <p className="mt-2 text-foreground/75 leading-relaxed">
            Sign in to your account or create one to open your dashboard — daily
            check-ins, medications, appointments, and clinic summaries.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/auth/login?next=${encodeURIComponent(NEXT)}`}
              className={buttonClassName({ variant: "primary", size: "lg" })}
            >
              Sign in
            </Link>
            <Link
              href={`/auth/signup?next=${encodeURIComponent(NEXT)}`}
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              Create account
            </Link>
          </div>
          <p className="mt-6 text-sm text-foreground/60">
            After sign-in or sign-up you land on your dashboard. Add your Supabase
            project URL and anon key to{" "}
            <code className="rounded bg-primary/10 px-1 font-mono text-xs">
              web/.env.local
            </code>{" "}
            so auth works (see <code className="font-mono text-xs">.env.example</code>
            ).
          </p>
        </Card>
      </div>
    </div>
  );
}
