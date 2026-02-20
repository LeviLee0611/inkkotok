-- posts 테이블에 GIF 첨부 URL 컬럼 추가
alter table if exists public.posts
add column if not exists media_url text;
