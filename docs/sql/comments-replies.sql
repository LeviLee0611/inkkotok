-- Enable one-level replies for comments
alter table if exists public.comments
  add column if not exists parent_id uuid null;

-- Keep parent and child comments within the same table
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
