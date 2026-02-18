-- Nested replies with max depth 10 (top-level depth = 1)
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table if exists public.comments
  add column if not exists id uuid;

update public.comments
set id = gen_random_uuid()
where id is null;

alter table public.comments
  alter column id set default gen_random_uuid(),
  alter column id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_pkey'
  ) then
    alter table public.comments
      add constraint comments_pkey primary key (id);
  end if;
end$$;

alter table if exists public.comments
  add column if not exists parent_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_parent_id_fkey'
  ) then
    alter table public.comments
      add constraint comments_parent_id_fkey
      foreign key (parent_id)
      references public.comments(id)
      on delete cascade;
  end if;
end$$;

create index if not exists comments_post_id_parent_id_created_at_idx
  on public.comments(post_id, parent_id, created_at);

create or replace function public.validate_comment_thread_depth_10()
returns trigger
language plpgsql
as $$
declare
  v_parent_id uuid;
  v_parent_post_id uuid;
  v_depth int := 1; -- parent depth starts at 1
  v_guard int := 0;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'parent_id cannot be self';
  end if;

  select c.id, c.post_id
    into v_parent_id, v_parent_post_id
  from public.comments c
  where c.id = new.parent_id;

  if v_parent_id is null then
    raise exception 'parent comment not found';
  end if;

  if v_parent_post_id <> new.post_id then
    raise exception 'parent comment must belong to same post';
  end if;

  while v_parent_id is not null loop
    v_guard := v_guard + 1;
    if v_guard > 30 then
      raise exception 'invalid comment tree';
    end if;

    if v_depth >= 10 then
      raise exception 'reply depth exceeds max depth 10';
    end if;

    select c.parent_id, c.post_id
      into v_parent_id, v_parent_post_id
    from public.comments c
    where c.id = v_parent_id;

    exit when v_parent_id is null;

    if v_parent_post_id <> new.post_id then
      raise exception 'ancestor comment must belong to same post';
    end if;

    if v_parent_id = new.id then
      raise exception 'comment cycle is not allowed';
    end if;

    v_depth := v_depth + 1;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_validate_comment_thread_depth_10 on public.comments;

create trigger trg_validate_comment_thread_depth_10
before insert or update of parent_id, post_id
on public.comments
for each row
execute function public.validate_comment_thread_depth_10();
