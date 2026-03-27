import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Set new password | ElderCare Companion",
};

export default function UpdatePasswordPage() {
  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="font-serif text-2xl font-semibold text-primary-dark">
        Set a new password
      </h1>
      <p className="mt-2 text-foreground/75 leading-relaxed">
        Choose a strong password you have not used elsewhere.
      </p>
      <div className="mt-8">
        <UpdatePasswordForm />
      </div>
    </Card>
  );
}
