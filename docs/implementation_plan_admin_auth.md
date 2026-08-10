# [Phase 4] 어드민 이메일 인증 및 UI/UX 개선 구현 계획서

현재 어드민 시스템에 필요한 이메일 인증 및 팝업 UI/레이아웃 개선을 위한 작업 계획입니다.

## User Review Required
> **이메일 인증 방식 확인:**
> @quebon.com 이메일을 입력하면, **6자리 인증 번호**가 메일로 발송되고, 프론트엔드 화면에서 해당 번호를 입력하면 로그인되는 방식(가장 안정적이고 흔한 방식)으로 구현하고자 합니다. 
> 이 방식이 괜찮으신지 확인 부탁드립니다.

> **선다형 정답 심볼 기호 처리:**
> 구글 시트에 정답(answer)이 원문자(①, ②, ③, ④) 형태로 저장되고 있습니다.
> 어드민 문항 수정 팝업에서 정답을 입력할 때 번거로움을 피하기 위해, 프론트엔드에서 "정답 옵션: [보기 1, 보기 2, 보기 3, 보기 4]" 중 하나를 선택하면 내부적으로 "①, ②, ③, ④"로 변환하여 시트에 저장하도록 처리하겠습니다.

## Proposed Changes

### 1. 백엔드 (Google Apps Script)
#### [MODIFY] [docs/gas_update_guide_admin.md](file:///d:/SynologyDrive/dev_projects/qblc-owner-assessment/docs/gas_update_guide_admin.md)
- `doPost` 함수 내에 **이메일 인증 번호 발송** 액션 (`request_admin_auth`) 추가
  - `@quebon.com` 도메인 검증
  - `MailApp.sendEmail`을 이용해 6자리 랜덤 인증 코드 발송
  - `CacheService`를 이용해 인증 코드 5분간 임시 저장
- **인증 번호 검증** 액션 (`verify_admin_auth`) 추가
  - 전달받은 코드와 캐시된 코드가 일치하는지 확인 및 결과 반환

### 2. 프론트엔드 (어드민 인증 및 라우팅)
#### [NEW] [src/pages/admin/AdminAuth.jsx](file:///d:/SynologyDrive/dev_projects/qblc-owner-assessment/src/pages/admin/AdminAuth.jsx)
- 관리자 이메일 입력 폼 및 인증 번호 입력 폼 컴포넌트 생성
- 로컬 스토리지를 활용하여 인증 상태(`isAdminAuthenticated`) 저장 및 유지

#### [MODIFY] [src/App.jsx](file:///d:/SynologyDrive/dev_projects/qblc-owner-assessment/src/App.jsx)
- `/admin` 경로 하위 라우트 보호(Protected Route) 로직 추가
- 인증되지 않은 경우 `/admin/login`으로 리다이렉트

### 3. 프론트엔드 (UI 및 팝업 수정)
#### [MODIFY] [src/pages/admin/AdminLayout.jsx](file:///d:/Solid Drive/dev_projects/qblc-owner-assessment/src/pages/admin/AdminLayout.jsx)
- 어드민 시스템 전체를 감싸는 컨테이너의 가로 폭을 고정 레이아웃(`max-width: 1200px`, `margin: 0 auto`)으로 변경

#### [MODIFY] [src/components/admin/QuestionManager.jsx](file:///d:/Solid Drive/dev_projects/qblc-owner-assessment/src/components/admin/QuestionManager.jsx)
- **보기 표시 문제 해결**: 백엔드에서 전달받은 `options` 배열을 풀어서 `option1` ~ `option4`에 정상적으로 바인딩하도록 초기화 로직 수정
- **정답 입력 개선**: 선다형인 경우 직접 텍스트를 입력하는 대신, [1번, 2번, 3번, 4번] 중 하나를 Select Box로 선택하도록 변경하고, 저장 시 원문자(①, ②, ③, ④)로 자동 치환되도록 개선

## Verification Plan
1. GAS 코드를 다시 한번 덮어쓰고 새 배포를 진행한 뒤, 프론트엔드에서 `/admin`에 접근하여 인증 페이지가 뜨는지 확인합니다.
2. `@quebon.com` 이메일을 입력하고 이메일로 발송된 6자리 코드로 로그인이 되는지 테스트합니다.
3. 관리자 페이지 가로폭이 1200px로 깔끔하게 고정되었는지 확인합니다.
4. 문항 관리에서 '수정' 팝업을 열었을 때 선다형 보기가 잘 출력되고 정답을 편하게 변경할 수 있는지 확인합니다.
