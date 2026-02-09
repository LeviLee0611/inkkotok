# Firebase Auth + Data Model Draft

## Goals
- Anyone can read posts and comments without logging in.
- Writing posts/comments requires login (Google or Microsoft).
- Users stay anonymous to the community. Displayed nickname is generated and stored in user profile.

## Auth Providers
- Google
- Microsoft (Azure AD / Microsoft Account)

## Auth Flow (MVP)
1. User clicks "로그인" in `/auth`.
2. Firebase Auth OAuth popup with Google or Microsoft.
3. On first login, create user profile doc with:
   - `displayName` generated (not real name)
   - `createdAt`, `lastSeenAt`
   - `provider` info
4. Client stores `uid` from Firebase Auth and uses it for write actions.

## Firestore Collections

### `users/{uid}`
Anonymous user profile.
- `displayName` (string)
- `createdAt` (timestamp)
- `lastSeenAt` (timestamp)
- `providers` (array of string)
- `status` (string: `active` | `suspended`)

### `lounges/{loungeId}`
Category and generation-specific lounges.
- `title` (string)
- `type` (string: `generation` | `topic`)
- `order` (number)
- `description` (string)
- `createdAt` (timestamp)

### `posts/{postId}`
Community posts.
- `title` (string)
- `body` (string)
- `loungeId` (string)
- `authorId` (string = uid)
- `authorDisplayName` (string)
- `status` (string: `active` | `hidden` | `removed`)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `likeCount` (number)
- `commentCount` (number)
- `reportCount` (number)

### `posts/{postId}/comments/{commentId}`
Comments in each post.
- `body` (string)
- `authorId` (string = uid)
- `authorDisplayName` (string)
- `status` (string: `active` | `hidden` | `removed`)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `reportCount` (number)

### `reports/{reportId}`
Content reports (posts or comments).
- `targetType` (string: `post` | `comment`)
- `targetPath` (string)
- `reason` (string)
- `reporterId` (string = uid)
- `createdAt` (timestamp)

### `moderation/{modId}`
Moderator actions (optional for MVP).
- `targetType` (string)
- `targetPath` (string)
- `action` (string: `hide` | `remove` | `restore`)
- `actorId` (string)
- `createdAt` (timestamp)

## Security Rules (Draft)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }

    match /users/{uid} {
      allow read: if false;
      allow create: if isOwner(uid);
      allow update: if isOwner(uid);
    }

    match /lounges/{loungeId} {
      allow read: if true;
      allow write: if false;
    }

    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if false;

      match /comments/{commentId} {
        allow read: if true;
        allow create: if isSignedIn();
        allow update, delete: if false;
      }
    }

    match /reports/{reportId} {
      allow read: if false;
      allow create: if isSignedIn();
      allow update, delete: if false;
    }
  }
}
```

## Indexes (When Needed)
- `posts` by `loungeId` + `createdAt` desc
- `posts` by `createdAt` desc
- `posts/{postId}/comments` by `createdAt` asc

## Notes
- `authorDisplayName` is stored redundantly for fast read; update via Cloud Function if nickname changes.
- `status` changes handled by server/admin (Cloud Functions or Admin SDK).
- PII not stored in public documents.
