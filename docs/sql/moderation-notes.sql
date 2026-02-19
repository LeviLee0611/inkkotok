-- Moderation notes for user-facing admin messages
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.moderation_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid null references auth.users(id) on delete set null,
  post_id uuid null references public.posts(id) on delete set null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists moderation_notes_user_read_created_idx
  on public.moderation_notes (user_id, is_read, created_at desc);
