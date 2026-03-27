import { SignedOutNotice } from "@/components/SignedOutNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { VoiceSettingsForm } from "./VoiceSettingsForm";

export const metadata = {
  title: "Voice settings | ElderCare Companion",
};

export default async function SettingsPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return (
      <p className="text-foreground/70">
        Configure Supabase environment variables to load this page.
      </p>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <SignedOutNotice />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tts_voice_id, speech_language")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Voice settings"
        description="Control read-aloud voice and language for accessibility features."
      />
      <VoiceSettingsForm
        initialVoiceId={profile?.tts_voice_id ?? null}
        initialLanguage={profile?.speech_language ?? "en-IE"}
      />
    </div>
  );
}
