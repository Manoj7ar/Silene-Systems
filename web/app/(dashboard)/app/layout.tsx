import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { AppNav } from "@/components/AppNav";
import { AppVoiceAgent } from "@/components/voice/AppVoiceAgent";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:pb-10">
        {children}
      </main>
      <MedicalDisclaimer />
      <AppVoiceAgent />
    </div>
  );
}
