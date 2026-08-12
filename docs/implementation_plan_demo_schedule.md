# [Phase 6] 시연 테스트 일정 선택 및 메일 발송 기능 구현 계획서

답안 제출 완료 화면(`ExamResult.jsx`)에서 시연 테스트 희망 일정을 선택하고 지정된 이메일(`qblc@quebon.com`)로 일정 및 제출 완료 내역을 발송하는 기능입니다.

## 🛠 Finalized Implementation Plan

### 1. 백엔드 (Google Apps Script - `docs/gas_update_guide_admin.md`)

#### [MODIFY] `docs/gas_update_guide_admin.md`
- **`doGet` 함수 수정: `action === "get_holidays"` 추가 (CORS 우회용 Proxy)**
  - 프론트엔드 요청 시, 백엔드(GAS)가 한국천문연구원 특일정보 API(공공데이터포털)를 호출합니다.
  - `UrlFetchApp`을 사용하여 서버 대 서버로 안전하게 통신하고 API 키 노출 및 CORS 에러를 완벽하게 방지합니다.
  - 가져온 공휴일 데이터를 JSON 형태로 프론트엔드에 전달합니다.
- **`doPost` 함수 수정: `action === "schedule_demo"` 추가**
  - 프론트엔드에서 { 이름, 가맹점, 제출일시, 선택한 시연일자, 선택한 시연시간 }을 전달받아 `qblc@quebon.com`으로 이메일을 발송합니다. (`MailApp.sendEmail` 사용)

### 2. 프론트엔드 화면 구현

#### [NEW] `src/components/exam/DemoScheduleModal.jsx`
- **역할:** 일정 선택을 위한 모달 팝업 컴포넌트.
- **기능:**
  - **날짜 계산 로직:** 오늘 기준 다음 날부터 탐색을 시작하여, 주말(토, 일)과 API로 불러온 공휴일을 제외한 **평일 3일**을 정확하게 계산합니다.
  - **UI/UX:** 큰 달력 대신 가로로 나열된 **직관적인 버튼/칩 형태**로 3일의 날짜를 제공합니다. (예: `[8/13 (화)] [8/14 (수)] [8/16 (금)]`)
  - **시간 선택:** 날짜 선택 시 하단에 오전 10시 ~ 오후 5시 (12시, 13시 제외)의 시간 버튼 리스트가 노출됩니다.
  - **제출 버튼:** 일시 선택 완료 후 백엔드의 `schedule_demo` API를 호출하고 모달을 닫습니다.

#### [MODIFY] `src/pages/ExamResult.jsx`
- 하단에 **[시연 테스트 일정 선택]** 버튼을 추가.
- 버튼 클릭 시 `DemoScheduleModal`을 렌더링하도록 상태 제어.
- 선택된 일정을 화면에 피드백(표시)해주고 버튼을 비활성화하거나 상태를 변경하여 중복 전송을 방지합니다.

## ✅ Verification Plan
- **백엔드:** `docs/gas_update_guide_admin.md`를 갱신하고 스크립트에 덮어쓴 후 새 배포.
- **프론트엔드:** 결과 화면에서 모달을 열고, 주말이 정상적으로 배제된 3일이 나오는지 확인. 특정 일시를 선택하고 제출했을 때 백엔드 에러 없이 실제 지정된 이메일 계정으로 수신되는지(권한 문제 확인 등) 테스트.
