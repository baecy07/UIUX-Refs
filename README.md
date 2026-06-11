# 게임 UI/UX 레퍼런스 매니저

React/Vite + Supabase + Cloudflare Pages Functions 기반의 내부용 게임 UI/UX 스크린샷 레퍼런스 도구입니다.

## 주요 기능

- 게임 목록, 게임 상세, 기능별 비교, 스크린샷 업로드
- Supabase Database + Storage 사용
- Cloudflare Pages Functions에서만 업로드/수정/삭제 처리
- `ADMIN_PASSWORD` 서버 검증 기반 편집 잠금
- 브라우저에서 업로드 이미지 WebP/JPEG 압축 후 전송
- 스크린샷 간 UI 플로우 연결

## 환경 변수

`.env.example`을 참고해 로컬 `.env`와 Cloudflare Pages 환경 변수를 설정합니다.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

프론트엔드에는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`만 노출됩니다. `SUPABASE_SERVICE_ROLE_KEY`와 `ADMIN_PASSWORD`는 Cloudflare Pages Functions 환경 변수로만 설정하세요.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. SQL Editor에서 `supabase/storage-policies.sql`을 실행합니다.
4. `uiux-screenshots` 버킷이 public인지 확인합니다.
5. anon role은 SELECT만 허용됩니다. INSERT/UPDATE/DELETE는 Cloudflare Functions의 service role key로만 수행됩니다.

## 로컬 개발

```bash
npm install
npm run dev
npm run lint
npm run build
```

Cloudflare Pages Functions까지 로컬에서 테스트하려면 Wrangler/Cloudflare Pages 개발 환경을 사용하세요.

```bash
npx wrangler pages dev dist --compatibility-date=2026-06-10
```

일반 Vite dev server에서는 `/api/*` Functions가 동작하지 않으므로 읽기 화면 중심으로 확인하고, 업로드/수정/삭제는 Pages dev 또는 배포 환경에서 확인하는 것을 권장합니다.

## Cloudflare Pages 배포

1. GitHub 저장소를 Cloudflare Pages에 연결합니다.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
5. 배포 후 `/api/check-password`가 정상 응답하는지 확인합니다.

## 운영 가이드

- 앱은 기본적으로 보기 전용입니다.
- 편집/업로드/삭제는 상단 `보기 전용` 버튼에서 비밀번호 확인 후 사용할 수 있습니다.
- 편집 가능 상태는 현재 탭 메모리에만 유지됩니다. 새로고침 또는 새 탭에서는 다시 잠금 해제가 필요합니다.
- 삭제 버튼은 보기 전용 모드에서 숨겨집니다.
- 스크린샷 삭제는 확인 대화상자 후 제목 입력이 필요합니다.
- DB에는 이미지 base64를 저장하지 않고 Storage path만 저장합니다.

## 알려진 제한

- 복잡한 사용자/권한/멤버 시스템은 의도적으로 구현하지 않았습니다.
- JSON 가져오기는 안전을 위해 기능 프리셋만 지원합니다.
- 대량 마이그레이션은 Supabase SQL 또는 별도 스크립트로 처리하는 것을 권장합니다.
- Vite dev server 단독 실행 시 Cloudflare Functions API는 실행되지 않습니다.
