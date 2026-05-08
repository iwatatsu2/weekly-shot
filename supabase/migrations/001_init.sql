-- WeeklyShot Database Schema (T1life project shared, ws_ prefix)

-- 1. ws_users
create table public.ws_users (
  id uuid primary key default gen_random_uuid(),
  line_user_id text unique not null,
  display_name text,
  timezone text not null default 'Asia/Tokyo',
  status text not null default 'active' check (status in ('active', 'paused', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. ws_schedules
create table public.ws_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ws_users(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  time_of_day time not null,
  medication text not null default 'unspecified' check (medication in ('wegovy', 'zepbound', 'other_glp1', 'unspecified')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. ws_injection_logs
create table public.ws_injection_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ws_users(id) on delete cascade,
  scheduled_at timestamptz not null,
  confirmed_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'missed')),
  reminder_count int not null default 0,
  created_at timestamptz not null default now()
);

-- 4. ws_notification_queue
create table public.ws_notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ws_users(id) on delete cascade,
  log_id uuid not null references public.ws_injection_logs(id) on delete cascade,
  send_at timestamptz not null,
  message_type text not null check (message_type in ('pre_day', 'on_day', 'follow_up')),
  sent_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'cancelled'))
);

-- Indexes
create index idx_ws_users_line_user_id on public.ws_users(line_user_id);
create index idx_ws_schedules_user_id on public.ws_schedules(user_id);
create index idx_ws_injection_logs_user_id on public.ws_injection_logs(user_id);
create index idx_ws_injection_logs_status on public.ws_injection_logs(status);
create index idx_ws_notification_queue_send_at on public.ws_notification_queue(send_at) where status = 'queued';
create index idx_ws_notification_queue_user_id on public.ws_notification_queue(user_id);

-- Enable RLS
alter table public.ws_users enable row level security;
alter table public.ws_schedules enable row level security;
alter table public.ws_injection_logs enable row level security;
alter table public.ws_notification_queue enable row level security;

-- RLS Policies
create policy "ws_users_select" on public.ws_users for select using (true);
create policy "ws_users_update" on public.ws_users for update using (true);

create policy "ws_schedules_select" on public.ws_schedules for select using (true);
create policy "ws_schedules_insert" on public.ws_schedules for insert with check (true);
create policy "ws_schedules_update" on public.ws_schedules for update using (true);

create policy "ws_injection_logs_select" on public.ws_injection_logs for select using (true);

-- notification_queue: service role only (no policies = no anon access)

-- updated_at trigger (reuse if exists, otherwise create)
create or replace function public.ws_handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ws_set_updated_at before update on public.ws_users
  for each row execute function public.ws_handle_updated_at();

create trigger ws_set_updated_at before update on public.ws_schedules
  for each row execute function public.ws_handle_updated_at();
