-- Post content gauge: 자유주제(0) ~ 정보기반(100)
-- Run in Supabase SQL Editor.

alter table if exists public.posts
  add column if not exists info_weight smallint not null default 50
  check (info_weight >= 0 and info_weight <= 100);

update public.posts
set info_weight = 50
where info_weight is null;
