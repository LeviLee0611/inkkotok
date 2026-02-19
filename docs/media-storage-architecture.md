# Media Storage Architecture (Migration-Friendly)

이미지 저장소 교체를 쉽게 하기 위한 현재 구조입니다.

## Adapter entry points
- `src/lib/media/types.ts`
  - `MediaStorageAdapter` 인터페이스 정의
- `src/lib/media/supabase-adapter.ts`
  - 현재 기본 구현(Supabase Storage)
- `src/lib/media/index.ts`
  - 앱에서 호출하는 공통 업로드 함수
  - `MEDIA_STORAGE_PROVIDER` 기반 구현 선택 지점

## Current usage
- 프로필 이미지 업로드 API:
  - `src/app/api/profile/avatar/route.ts`
  - 직접 Supabase SDK 호출 대신 `uploadPublicImageFile(...)` 사용

## Migration rule
1. 새로운 저장소용 adapter 파일 추가
2. `MediaStorageAdapter` 구현
3. `src/lib/media/index.ts`의 provider switch에 연결
4. API/화면 코드는 그대로 유지

## Env
- `MEDIA_STORAGE_PROVIDER=supabase` (기본)
