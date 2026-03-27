import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Forgot password | ElderCare Companion",
};

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="font-serif text-2xl font-semibold text-primary-dark">
        Reset password
      </h1>
      <p className="mt-2 text-foreground/75 leading-relaxed">
        Enter your email and we will send a link to set a new password.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </Card>
  );
}
