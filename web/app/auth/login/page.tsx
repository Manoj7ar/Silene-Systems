import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata = {
  title: "Sign in | ElderCare Companion",
};

function LoginFallback() {
  return (
    <div className="h-40 w-full max-w-md animate-pulse rounded-2xl bg-surface-alt" />
  );
}

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="font-serif text-2xl font-semibold text-primary-dark">
        Sign in
      </h1>
      <p className="mt-2 text-foreground/75 leading-relaxed">
        Use the email and password for your ElderCare Companion account.
      </p>
      <div className="mt-8">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </Card>
  );
}
