# Auth.js + Supabase Data Model

## Goals
- Anyone can read posts and comments without logging in.
- Writing posts/comments requires login (Google, Microsoft, Naver, Kakao).
- Users remain anonymous; only a generated nickname is shown.

## Auth Providers
- Google
- Microsoft (Azure AD)
- Naver
- Kakao

## Auth Flow (MVP)
1. User clicks "Login" on `/auth`.
2. OAuth flow via Auth.js (NextAuth).
3. On first login, create a profile record in Supabase:
   - `display_name` generated
   - `created_at`, `last_seen_at`
   - `providers` list
4. Client uses session `user.id` for writes.

## Supabase Tables

### `profiles`
Anonymous user profile.
- `id` (text, primary key) - auth subject
- `display_name` (text)
- `email` (text, nullable)
- `image_url` (text, nullable)
- `providers` (text[])
- `status` (text: `active` | `suspended`)
- `created_at` (timestamptz)
- `last_seen_at` (timestamptz)

### `lounges`
- `id` (uuid, primary key)
- `title` (text)
- `type` (text: `generation` | `topic`)
- `order` (int)
- `description` (text)
- `created_at` (timestamptz)

### `posts`
- `id` (uuid, primary key)
- `title` (text)
- `body` (text)
- `lounge_id` (uuid, references `lounges.id`)
- `author_id` (text, references `profiles.id`)
- `author_display_name` (text)
- `status` (text: `active` | `hidden` | `removed`)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `like_count` (int)
- `comment_count` (int)
- `report_count` (int)

### `comments`
- `id` (uuid, primary key)
- `post_id` (uuid, references `posts.id`)
- `body` (text)
- `author_id` (text, references `profiles.id`)
- `author_display_name` (text)
- `status` (text: `active` | `hidden` | `removed`)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `report_count` (int)

### `reports`
- `id` (uuid, primary key)
- `target_type` (text: `post` | `comment`)
- `target_id` (uuid)
- `reason` (text)
- `reporter_id` (text, references `profiles.id`)
- `created_at` (timestamptz)

### `moderation`
- `id` (uuid, primary key)
- `target_type` (text)
- `target_id` (uuid)
- `action` (text: `hide` | `remove` | `restore`)
- `actor_id` (text)
- `created_at` (timestamptz)

## Notes
- `author_display_name` is stored redundantly for fast reads.
- Use RLS to prevent client writes to protected fields.
