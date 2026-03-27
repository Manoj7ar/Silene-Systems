-- Voice preferences for TTS/STT (ElevenLabs)
alter table public.profiles
  add column if not exists tts_voice_id text,
  add column if not exists speech_language text default 'en-IE';

comment on column public.profiles.tts_voice_id is 'ElevenLabs voice_id override; null uses env default';
comment on column public.profiles.speech_language is 'BCP 47 tag for Web Speech + STT hint (e.g. en-IE, en)';
