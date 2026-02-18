create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_reactions_post_created_idx
  on public.post_reactions (post_id, created_at desc);
