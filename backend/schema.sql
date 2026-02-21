-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  role text check (role in ('patient', 'provider', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Providers Table
create table public.providers (
  id uuid references public.users(id) not null primary key,
  specialty text not null,
  department text,
  bio text,
  avg_consultation_minutes int default 30,
  buffer_minutes int default 5,
  max_concurrent int default 1
);

-- 3. Availability Slots
create table public.availability_slots (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references public.providers(id) not null,
  day_of_week int not null, -- 0=Sun, 1=Mon, etc.
  start_time time not null,
  end_time time not null,
  is_active boolean default true
);

-- 4. Appointments
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.users(id) not null,
  provider_id uuid references public.providers(id) not null,
  scheduled_at timestamp with time zone not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.providers enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

-- RLS Policies (Simplified for Hackathon Demo - Allow All for Authenticated)
create policy "Public profiles are viewable by everyone" on public.users for select using (true);
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Providers are viewable by everyone" on public.providers for select using (true);
create policy "Providers can insert their own profile" on public.providers for insert with check (auth.uid() = id);

create policy "Slots are viewable by everyone" on public.availability_slots for select using (true);

create policy "Users can view their own appointments" on public.appointments for select using (auth.uid() = patient_id or auth.uid() = provider_id);
create policy "Users can insert appointments" on public.appointments for insert with check (auth.uid() = patient_id);
create policy "Users can update their own appointments" on public.appointments for update using (auth.uid() = patient_id or auth.uid() = provider_id);

create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Dummy Data Insertion (Only run if you have created these users in Auth first, or use these IDs if disabling FK checks)
-- Note: Since we can't insert into auth.users directly via SQL in Supabase dashboard easily without admin API, 
-- we will insert DUMMY providers assuming they exist or just for display if we relax FKs.
-- FOR DEMO: We will just insert into public tables. If FK fails, you need to create users in Supabase Auth first.

-- However, for a hackathon demo, we often want "clean" data.
-- Let's create a stored procedure to help seed data if users exist.

-- DUMMY DATA FOR DEMO (Run this after creating a user in the app to populate their dashboard)
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the Users table after signing up.

/*
insert into public.notifications (user_id, title, body, is_read, created_at)
values 
('YOUR_USER_ID_HERE', 'Appointment Confirmed', 'Your visit with Dr. Sarah Jenkins is confirmed for tomorrow at 10:00 AM.', false, now() - interval '2 hours'),
('YOUR_USER_ID_HERE', 'Lab Results Ready', 'Your blood work analysis is complete. View your report in the Lab Analyzer.', false, now() - interval '1 day'),
('YOUR_USER_ID_HERE', 'System Update', 'HealthQ has been updated with new AI features.', true, now() - interval '3 days');

insert into public.appointments (patient_id, provider_id, scheduled_at, status, reason)
values
('YOUR_USER_ID_HERE', 'PROVIDER_UUID', now() + interval '1 day', 'confirmed', 'Regular Checkup'),
('YOUR_USER_ID_HERE', 'PROVIDER_UUID', now() - interval '2 days', 'completed', 'Flu Symptoms');
*/
