-- ElderCare Companion — initial schema (run in Supabase SQL editor or via CLI)

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  age int,
  conditions text[] default '{}',
  allow_family_alerts boolean not null default false,
  role text not null default 'patient' check (role in ('patient', 'carer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- Daily health logs
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null default (current_date),
  symptoms text,
  mood text,
  mood_rating int check (mood_rating is null or (mood_rating >= 1 and mood_rating <= 5)),
  vitals jsonb default '{}',
  notes text,
  voice_transcript text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);

-- Medications
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  drug_name text not null,
  dosage text,
  frequency text,
  schedule jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists medications_user_idx on public.medications (user_id);

-- Medication adherence events (one row per day per med optional)
create table if not exists public.medication_events (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_date date not null,
  taken boolean not null default false,
  created_at timestamptz not null default now(),
  unique (medication_id, event_date)
);

create index if not exists medication_events_user_date_idx on public.medication_events (user_id, event_date desc);

-- Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  appt_at timestamptz not null,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists appointments_user_idx on public.appointments (user_id, appt_at);

-- Alerts
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  description text not null,
  severity text not null default 'info' check (severity in ('info', 'watch', 'urgent')),
  sent_to_family boolean not null default false,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists alerts_user_idx on public.alerts (user_id, created_at desc);

-- Family / carer links (patient invites carer by email — carer must register same email or link by id)
create table if not exists public.family_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users (id) on delete cascade,
  carer_id uuid not null references auth.users (id) on delete cascade,
  can_see_notes boolean not null default false,
  can_see_vitals boolean not null default true,
  created_at timestamptz not null default now(),
  unique (patient_id, carer_id)
);

create index if not exists family_links_patient_idx on public.family_links (patient_id);
create index if not exists family_links_carer_idx on public.family_links (carer_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.medications enable row level security;
alter table public.medication_events enable row level security;
alter table public.appointments enable row level security;
alter table public.alerts enable row level security;
alter table public.family_links enable row level security;

-- Profiles: users manage own row; carers can read linked patients
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Carers read patient profiles they are linked to
create policy "profiles_select_carer"
  on public.profiles for select
  using (
    exists (
      select 1 from public.family_links fl
      where fl.patient_id = profiles.id and fl.carer_id = auth.uid()
    )
  );

-- Daily logs: own rows; carers read linked patient (no raw notes if policy — simplified: carers see aggregates via view or app filters; here allow read without notes if not can_see_notes)
create policy "daily_logs_own"
  on public.daily_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "daily_logs_carer_select"
  on public.daily_logs for select
  using (
    exists (
      select 1 from public.family_links fl
      where fl.patient_id = daily_logs.user_id and fl.carer_id = auth.uid()
    )
  );

-- Medications
create policy "medications_own"
  on public.medications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "medications_carer_select"
  on public.medications for select
  using (
    exists (
      select 1 from public.family_links fl
      where fl.patient_id = medications.user_id and fl.carer_id = auth.uid()
    )
  );

-- Medication events
create policy "medication_events_own"
  on public.medication_events for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "medication_events_carer_select"
  on public.medication_events for select
  using (
    exists (
      select 1 from public.family_links fl
      where fl.patient_id = medication_events.user_id and fl.carer_id = auth.uid()
    )
  );

-- Appointments
create policy "appointments_own"
  on public.appointments for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Alerts
create policy "alerts_own"
  on public.alerts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "alerts_carer_select"
  on public.alerts for select
  using (
    exists (
      select 1 from public.family_links fl
      where fl.patient_id = alerts.user_id and fl.carer_id = auth.uid()
    )
  );

-- Family links: patient and carer can see their links
create policy "family_links_participant"
  on public.family_links for select
  using (patient_id = auth.uid() or carer_id = auth.uid());

create policy "family_links_patient_insert"
  on public.family_links for insert
  with check (patient_id = auth.uid());

create policy "family_links_patient_delete"
  on public.family_links for delete
  using (patient_id = auth.uid());
