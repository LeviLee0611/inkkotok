# Firebase Auth + Supabase Data Model

## Goals
- Anyone can read posts and comments without logging in.
- Writing posts/comments requires Firebase login.
- Google 로그인은 유지하고, 이메일 없는 사용자는 Anonymous Auth로 가입/로그인.
- 익명 계정은 이후 Google 계정으로 링크(link) 업그레이드 가능.

## Providers
- Google OAuth
- Anonymous Auth

## Auth Flow
1. User signs in with Google or Anonymous in the client.
2. Client gets Firebase ID token.
3. Client calls `POST /api/auth/sync` with `Authorization: Bearer <idToken>`.
4. Server verifies the token and upserts `users` by `firebase_uid`.
5. Server ensures `user_profiles` row exists.
6. Protected APIs use the same token verification middleware.
7. `GET /api/me` returns `users + user_profiles`.

## Server-side Rules
- `role`, `status`, `deleted_at` are server-managed only.
- Client `uid/email/role/status` input is never trusted.
- Soft delete uses `deleted_at` instead of hard delete.

## Tables
- `users`: authentication-linked account record (firebase uid, provider, email nullable, role/status, soft delete)
- `user_profiles`: community profile fields
- `audit_logs`: admin action log

## SQL
- Run `docs/sql/firebase-auth-schema.sql` in Supabase SQL editor.
- Run `docs/sql/admin-role-schema.sql` to enable DB-based admin/manager roles.
- Run `docs/sql/moderation-notes.sql` to enable admin-to-user moderation memos.
