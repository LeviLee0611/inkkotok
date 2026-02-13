create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  provider text not null default 'unknown',
  email citext null,
  display_name text null,
  photo_url text null,
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended', 'banned')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create unique index if not exists users_email_active_uniq
  on public.users (email)
  where email is not null and deleted_at is null;

create index if not exists users_status_idx on public.users (status);
create index if not exists users_role_idx on public.users (role);

create table if not exists public.user_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  bio text null,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_user_id uuid null references public.users(id),
  target_user_id uuid null references public.users(id),
  action text not null,
  reason text null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_target_idx
  on public.audit_logs (target_user_id, created_at desc);

create index if not exists audit_logs_action_idx
  on public.audit_logs (action, created_at desc);
