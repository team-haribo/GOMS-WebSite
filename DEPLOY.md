# GOMS-Web 배포 가이드 (Vercel + Supabase)

이 문서는 `main` 브랜치를 **무료로** Vercel에 배포하는 전체 과정을 설명합니다.
데이터는 Supabase(무료 Postgres)에 저장됩니다.

---

## 0. 준비물

- GitHub 계정 (이 레포지토리가 푸시되어 있어야 함)
- Google 계정 (Supabase / Vercel 가입용)
- `.env.local` 파일의 값들 (특히 `GOOGLE_CLIENT_ID`, `ADMIN_*`)

---

## 1. Supabase 프로젝트 만들기

1. https://supabase.com 접속 → **Start your project** → GitHub로 로그인
2. **New project** 클릭
   - **Name**: `goms-web` (아무거나)
   - **Database Password**: 강력한 비밀번호 생성 (안 까먹게 저장)
   - **Region**: `Northeast Asia (Seoul)` 추천
   - **Pricing Plan**: Free
3. 프로젝트 생성까지 1~2분 대기

### 1-1. 테이블 만들기

1. 좌측 메뉴 **SQL Editor** → **New query**
2. 이 레포의 `supabase/schema.sql` 내용 전체를 복사해서 붙여넣기
3. 우측 상단 **Run** 클릭 → `Success. No rows returned` 뜨면 OK

### 1-2. API 키 복사

1. 좌측 메뉴 **Project Settings** → **API**
2. 두 값을 복사해서 어딘가 임시로 저장:
   - **Project URL** → `SUPABASE_URL` 값
   - **Project API keys** 섹션의 **`service_role`** (secret) → `SUPABASE_SERVICE_ROLE_KEY` 값

> ⚠️ `service_role` 키는 **절대 프론트엔드/공개 저장소에 노출하면 안 됩니다**.
> 이 키를 가진 사람은 RLS를 무시하고 DB 전체를 읽고 쓸 수 있어요.

---

## 2. 로컬에서 Supabase 연결 테스트 & 데이터 이관

### 2-1. `.env.local`에 Supabase 값 추가

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 2-2. 기존 JSON 데이터 Supabase로 옮기기

```bash
npm run seed:supabase
```

성공하면 이런 출력이 나옵니다:

```
✓ seeded applications
✓ seeded role-status
✓ seeded members-meta
✓ seeded form-config
```

Supabase 대시보드 → **Table Editor** → `kv` 테이블에서 4개 row가 생겼는지 확인.

### 2-3. 로컬에서 정상 동작 확인

```bash
npm run dev
```

→ http://localhost:3000 접속 → 지원자 제출, 관리자 로그인, 폼 수정 등이 모두 동작하는지 확인.

이 단계에서 잘 동작한다면 Vercel 배포는 거의 끝난 거예요.

---

## 3. GitHub에 푸시

Supabase 값, admin 비번 등이 `.env.local`에 있는지 확인하고 (절대 커밋 X), 나머지 변경사항을 커밋 & 푸시:

```bash
git add -A
git status   # .env.local이 스테이징되지 않았는지 반드시 확인
git commit -m "feat: migrate storage to Supabase for Vercel deploy"
git push origin main
```

> `data/` 폴더는 이제 `.gitignore`에 있어요. 이미 커밋된 상태라면
> `git rm -r --cached data` 한 번 실행 후 다시 커밋하세요.

---

## 4. Vercel 배포

1. https://vercel.com 접속 → GitHub로 로그인
2. **Add New → Project** → 이 레포지토리 선택 → **Import**
3. **Framework Preset**은 Next.js로 자동 감지됨, 그대로 두면 됨
4. **Environment Variables** 섹션 펼치기 → 아래 값들 **전부** 추가:

   | Key | Value |
   |---|---|
   | `ADMIN_ID` | `.env.local`과 동일 |
   | `ADMIN_PASSWORD` | `.env.local`과 동일 |
   | `ADMIN_SESSION_SECRET` | `.env.local`과 동일 (긴 랜덤 문자열) |
   | `GOOGLE_CLIENT_ID` | `.env.local`과 동일 |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `.env.local`과 동일 |
   | `GITHUB_TOKEN` | `.env.local`과 동일 |
   | `SUPABASE_URL` | Supabase에서 복사 |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase에서 복사 |

5. **Deploy** 클릭
6. 2~3분 후 `https://<프로젝트명>.vercel.app` 도메인 확인

---

## 5. Google OAuth 도메인 등록 (중요!)

로그인이 안 될 거예요, 이 단계 없으면.

1. https://console.cloud.google.com → 해당 프로젝트 선택
2. **API & Services → Credentials** → 기존 OAuth 2.0 Client ID 클릭
3. **Authorized JavaScript origins**에 Vercel 도메인 추가:
   ```
   https://<프로젝트명>.vercel.app
   ```
4. **Save** → 몇 분 후 반영됨

---

## 6. 배포 후 확인사항

- [ ] `/` 홈페이지 정상 로드
- [ ] `/apply` 에서 @gsm.hs.kr Google 로그인 → 성공
- [ ] `/apply/ios` 에서 지원서 제출 → 성공
- [ ] `/admin/login` 에서 관리자 로그인 → 성공
- [ ] `/admin` 에서 지원폼 필드 추가/삭제 → Supabase에 반영되는지 확인
- [ ] 브라우저 새로고침 후에도 데이터 유지되는지

---

## 트러블슈팅

### "Missing SUPABASE_URL" 에러
→ Vercel Environment Variables에 값이 안 들어갔거나 오타. 수정 후 재배포.

### Google 로그인 후 "redirect_uri_mismatch"
→ 5번 단계 안 함. Vercel 도메인을 Google OAuth origins에 추가.

### 로컬에서는 잘 되는데 배포 후 데이터 저장 안 됨
→ Vercel에 `SUPABASE_SERVICE_ROLE_KEY`(anon 말고!) 들어갔는지 확인.

### Supabase 무료 티어 한도
- 500MB DB → 학생 프로젝트엔 차고 넘침
- 5GB 월 대역폭 → 충분
- 일주일 활동 없으면 DB가 pause됨. 대시보드에서 resume 버튼 한 번 누르면 끝.

---

## 참고

- Vercel hobby plan은 **상업적 이용 불가**. 학교 프로젝트는 OK.
- 커스텀 도메인 원하면 Vercel에서 설정 → Google OAuth origins에도 추가 잊지 말 것.
- DB 백업: Supabase는 7일 PITR(point-in-time recovery) 무료 제공.
