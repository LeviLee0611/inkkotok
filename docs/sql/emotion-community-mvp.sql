-- Emotion-driven community MVP schema (additive / backward-compatible)
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1) Emotion-first categories (max 5)
create table if not exists public.categories (
  id smallint primary key,
  slug text not null unique,
  name_ko text not null,
  sort_order smallint not null
);

insert into public.categories (id, slug, name_ko, sort_order)
values
  (1, 'conflict', 'Conflict & 고민', 1),
  (2, 'venting', 'Venting & Stories', 2),
  (3, 'advice', 'Advice Request', 3),
  (4, 'poll', 'Poll & Decision', 4),
  (5, 'love', 'Love & Positive Stories', 5)
on conflict (id) do update
set slug = excluded.slug,
    name_ko = excluded.name_ko,
    sort_order = excluded.sort_order;

-- 2) Optional tags (cross-category)
create table if not exists public.tags (
  id smallint primary key,
  slug text not null unique,
  name_ko text not null
);

insert into public.tags (id, slug, name_ko)
values
  (1, 'money-conflicts', 'Money Conflicts'),
  (2, 'parenting', 'Parenting-related conflicts'),
  (3, 'in-law', 'In-law issues')
on conflict (id) do update
set slug = excluded.slug,
    name_ko = excluded.name_ko;

-- 3) Extend existing posts table (additive)
alter table if exists public.posts
  add column if not exists category_id smallint references public.categories(id),
  add column if not exists mood text not null default 'mixed'
    check (mood in ('sad', 'angry', 'anxious', 'mixed', 'hopeful', 'happy')),
  add column if not exists is_anonymous boolean not null default true,
  add column if not exists comments_count int not null default 0,
  add column if not exists reactions_count int not null default 0,
  add column if not exists votes_count int not null default 0,
  add column if not exists hot_score numeric not null default 0;

create index if not exists posts_category_hot_created_idx
  on public.posts (category_id, hot_score desc, created_at desc);

create index if not exists posts_created_idx
  on public.posts (created_at desc);

-- Keep current posts valid by assigning a default category when null.
update public.posts
set category_id = 2
where category_id is null;

-- Make category required after backfill.
do $$
begin
  begin
    alter table public.posts
      alter column category_id set not null;
  exception when others then
    null;
  end;
end$$;

-- 4) Post tags (many-to-many)
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id smallint not null references public.tags(id),
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create index if not exists post_tags_tag_created_idx
  on public.post_tags (tag_id, created_at desc);

-- 5) Extend existing comments table (additive)
alter table if exists public.comments
  add column if not exists reactions_count int not null default 0;

create index if not exists comments_post_created_idx
  on public.comments (post_id, created_at desc);

-- 6) Reactions
create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  reaction_type text not null
    check (reaction_type in ('hug', 'feel_you', 'cheer', 'sad', 'angry')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction_type)
);

-- Compatibility: if post_reactions already exists from previous schema,
-- add reaction_type with default value.
alter table if exists public.post_reactions
  add column if not exists reaction_type text;

update public.post_reactions
set reaction_type = 'hug'
where reaction_type is null;

do $$
begin
  begin
    alter table public.post_reactions
      alter column reaction_type set not null;
  exception when others then
    null;
  end;
end$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'post_reactions_reaction_type_check'
  ) then
    alter table public.post_reactions
      add constraint post_reactions_reaction_type_check
      check (reaction_type in ('hug', 'feel_you', 'cheer', 'sad', 'angry'));
  end if;
end$$;

create index if not exists post_reactions_post_created_idx
  on public.post_reactions (post_id, created_at desc);

create index if not exists post_reactions_user_created_idx
  on public.post_reactions (user_id, created_at desc);

create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null,
  reaction_type text not null
    check (reaction_type in ('hug', 'feel_you', 'cheer')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, reaction_type)
);

create index if not exists comment_reactions_comment_created_idx
  on public.comment_reactions (comment_id, created_at desc);

-- 7) Polls / votes
create table if not exists public.polls (
  post_id uuid primary key references public.posts(id) on delete cascade,
  closes_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_post_id uuid not null references public.polls(post_id) on delete cascade,
  label text not null,
  vote_count int not null default 0,
  sort_order smallint not null,
  created_at timestamptz not null default now()
);

create unique index if not exists poll_options_post_sort_uniq
  on public.poll_options (poll_post_id, sort_order);

create table if not exists public.poll_votes (
  poll_post_id uuid not null references public.polls(post_id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (poll_post_id, user_id)
);

create index if not exists poll_votes_option_idx
  on public.poll_votes (option_id, created_at desc);

-- 8) Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null
    check (type in ('comment', 'reply', 'reaction', 'hot_post')),
  post_id uuid null references public.posts(id) on delete cascade,
  comment_id uuid null references public.comments(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_read_created_idx
  on public.notifications (user_id, is_read, created_at desc);

-- 9) Lightweight engagement counters + hot score
create or replace function public.refresh_post_aggregates(p_post_id uuid)
returns void
language plpgsql
as $$
declare
  v_comments int := 0;
  v_reactions int := 0;
  v_votes int := 0;
  v_age_hours numeric := 0;
  v_hot numeric := 0;
begin
  select count(*)
    into v_comments
  from public.comments c
  where c.post_id = p_post_id;

  select count(*)
    into v_reactions
  from public.post_reactions r
  where r.post_id = p_post_id;

  select count(*)
    into v_votes
  from public.poll_votes v
  where v.poll_post_id = p_post_id;

  select greatest(extract(epoch from (now() - p.created_at)) / 3600.0, 0)
    into v_age_hours
  from public.posts p
  where p.id = p_post_id;

  -- Simple hot score for MVP:
  -- (comments*3 + reactions*1.5 + votes*2) / pow(age_hours + 2, 1.2)
  v_hot := (v_comments * 3 + v_reactions * 1.5 + v_votes * 2)
    / power(v_age_hours + 2, 1.2);

  update public.posts p
  set comments_count = v_comments,
      reactions_count = v_reactions,
      votes_count = v_votes,
      hot_score = coalesce(v_hot, 0)
  where p.id = p_post_id;
end;
$$;

create or replace function public.trg_refresh_post_aggregates_from_comment()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_post_aggregates(coalesce(new.post_id, old.post_id));
  return null;
end;
$$;

create or replace function public.trg_refresh_post_aggregates_from_post_reaction()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_post_aggregates(coalesce(new.post_id, old.post_id));
  return null;
end;
$$;

create or replace function public.trg_refresh_post_aggregates_from_vote()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_post_aggregates(coalesce(new.poll_post_id, old.poll_post_id));
  return null;
end;
$$;

drop trigger if exists trg_refresh_post_aggregates_comments on public.comments;
create trigger trg_refresh_post_aggregates_comments
after insert or delete on public.comments
for each row
execute function public.trg_refresh_post_aggregates_from_comment();

drop trigger if exists trg_refresh_post_aggregates_post_reactions on public.post_reactions;
create trigger trg_refresh_post_aggregates_post_reactions
after insert or delete on public.post_reactions
for each row
execute function public.trg_refresh_post_aggregates_from_post_reaction();

drop trigger if exists trg_refresh_post_aggregates_votes on public.poll_votes;
create trigger trg_refresh_post_aggregates_votes
after insert or delete on public.poll_votes
for each row
execute function public.trg_refresh_post_aggregates_from_vote();

-- 10) Backfill current counters for existing rows
do $$
declare
  v_post_id uuid;
begin
  for v_post_id in select id from public.posts loop
    perform public.refresh_post_aggregates(v_post_id);
  end loop;
end$$;
