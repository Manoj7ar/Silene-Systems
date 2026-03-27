import { SignupForm } from "@/components/auth/SignupForm";
import { Card } from "@/components/ui/Card";
import { Suspense } from "react";

export const metadata = {
  title: "Create account | ElderCare Companion",
};

function SignupFallback() {
  return (
    <div className="h-48 w-full max-w-md animate-pulse rounded-2xl bg-surface-alt" />
  );
}

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="font-serif text-2xl font-semibold text-primary-dark">
        Create account
      </h1>
      <p className="mt-2 text-foreground/75 leading-relaxed">
        Your profile is created automatically. Choose patient or family/carer to
        match how you use the app.
      </p>
      <div className="mt-8">
        <Suspense fallback={<SignupFallback />}>
          <SignupForm />
        </Suspense>
      </div>
    </Card>
  );
}
