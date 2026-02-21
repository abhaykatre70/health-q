-- Comprehensive Schema for HealthQ
-- Run this in Supabase SQL Editor to ensure all features work correctly.

-- Enable UUID
create extension if not exists "uuid-ossp";

-- 1. Users table (Extends Auth)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  role text check (role in ('patient', 'provider', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Providers table
create table if not exists public.providers (
  id uuid references public.users(id) not null primary key,
  specialty text not null,
  department text,
  bio text,
  avg_consultation_minutes int default 30,
  buffer_minutes int default 5,
  is_available boolean default true
);

-- 3. Availability Slots (Specific instances for booking)
create table if not exists public.availability_slots (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references public.providers(id) not null,
  slot_start timestamp with time zone not null,
  slot_end timestamp with time zone not null,
  is_booked boolean default false,
  created_at timestamp with time zone default now()
);

-- 4. Appointments
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.users(id) not null,
  provider_id uuid references public.providers(id) not null,
  scheduled_at timestamp with time zone not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  reason text,
  created_at timestamp with time zone default now()
);

-- 5. Queue Entries (Live queue management)
create table if not exists public.queue_entries (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments(id),
  provider_id uuid references public.providers(id) not null,
  patient_id uuid references public.users(id) not null,
  queue_position int not null,
  status text default 'waiting' check (status in ('waiting', 'in_consultation', 'completed', 'skipped')),
  priority text default 'standard' check (priority in ('standard', 'high', 'emergency')),
  joined_at timestamp with time zone default now()
);

-- 6. Notifications
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- 7. Health Metrics (For interactive graphs)
create table if not exists public.health_metrics (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.users(id) not null,
  metric_type text not null, -- 'pulse', 'bp_systolic', 'bp_diastolic', 'blood_glucose', 'weight'
  value decimal not null,
  unit text,
  recorded_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.providers enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.queue_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.health_metrics enable row level security;

-- Policies (Simplified for demo: Authenticated users can do everything relevant)
create policy "Users can view all public profiles" on public.users for select using (true);
create policy "Users can view all providers" on public.providers for select using (true);
create policy "Users can view all slots" on public.availability_slots for select using (true);
create policy "Users can modify their own appointments" on public.appointments for all using (auth.uid() = patient_id or auth.uid() = provider_id);
create policy "Users can view queue" on public.queue_entries for select using (true);
create policy "Users can view their notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can view their health metrics" on public.health_metrics for select using (auth.uid() = patient_id);
create policy "Users can insert health metrics" on public.health_metrics for insert with check (auth.uid() = patient_id);

-- SEED DUMMY DATA FOR CORE TABLES (If needed)
-- Note: Replace with actual IDs if running manually, or let the app seed logic handle it.
