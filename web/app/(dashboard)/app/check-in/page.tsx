import { CheckInVoicePrompts } from "@/components/voice/CheckInVoicePrompts";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { CheckInForm } from "./CheckInForm";

export const metadata = {
  title: "Daily check-in | ElderCare Companion",
};

export default async function CheckInPage() {
  let speechLanguage = "en-IE";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("speech_language")
        .eq("id", user.id)
        .single();
      if (profile?.speech_language?.trim()) {
        speechLanguage = profile.speech_language.trim();
      }
    }
  } catch {
    /* default */
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Daily check-in"
        description="Answer in your own words. You can use the microphone or type. Large buttons are easier on touch devices."
      />
      <CheckInVoicePrompts />
      <CheckInForm speechLanguage={speechLanguage} />
    </div>
  );
}
