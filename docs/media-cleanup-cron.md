# Post Media Cleanup (Orphan Files)

글쓰기 중 업로드 후 취소/삭제된 이미지로 생기는 `post-media` 고아 파일을 정리하는 운영 가이드입니다.

## What it does
- 대상 버킷: `post-media`
- 기준: `posts.body`, `posts.media_url`에 참조되지 않는 파일
- 추가 조건: 업로드 후 `ttlHours` 지난 파일만 삭제 (기본 24시간)

## Admin API
- Route: `POST /api/admin/media/cleanup`
- 권한: 관리자만 실행 가능
- Body (optional):

```json
{
  "ttlHours": 24
}
```

응답 예시:

```json
{
  "ok": true,
  "ttlHours": 24,
  "scanned": 120,
  "referenced": 77,
  "staleCandidates": 18,
  "deleted": 18
}
```

## Run manually (example)

```bash
curl -X POST "https://YOUR_DOMAIN/api/admin/media/cleanup" \
  -H "authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "content-type: application/json" \
  -d '{"ttlHours":24}'
```

## Schedule (recommended)
- 하루 1~2회 주기 실행 권장
- 방법 예시:
  - cron-job.org 같은 외부 cron에서 API 호출
  - GitHub Actions scheduled workflow에서 API 호출

## Notes
- 파일명에 포함된 타임스탬프(`image-<ms>-...`, `gif-<ms>-...`)를 기준으로 TTL 판정합니다.
- 타임스탬프 패턴이 없는 파일은 안전상 삭제 대상에서 제외됩니다.
