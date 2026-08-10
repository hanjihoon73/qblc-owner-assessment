# 구현 계획 (Implementation Plan): QBLC Owner Assessment

## 1. 개요 및 목표
본 문서는 `qblc-owner-assessment-planning.md` 기획서를 바탕으로, 구글 스프레드시트를 데이터베이스로 활용하여 최대한 가볍고 안정적으로 동작하는 가맹 원장 평가 시스템을 구축하기 위한 구현 계획입니다. 향후 사내 공식 시스템으로의 이관을 고려하여, 종속성이 낮고 유지보수가 용이한 구조로 설계합니다.

> [!IMPORTANT]
> **주요 요구사항 반영**
> 1. **DB**: 구글 스프레드시트 활용 (Google Apps Script 기반 API 연동). **정답 데이터(Answer Key)도 구글 시트에서 관리하여 관리자의 수정 용이성 확보.**
> 2. **마이그레이션 고려**: 추후 공식 DB 흡수를 위해, 프론트엔드 내 비즈니스 로직과 데이터 통신(API) 레이어를 명확히 분리
> 3. **가볍고 안정적인 기술**: 무거운 프레임워크나 복잡한 백엔드 없이 **React (Vite) + 순수 CSS** 활용
> 4. **디자인 테마**: 깔끔한 화이트 배경 및 Lucide 아이콘 적용. 개발 전 디자인 시스템 확정 후 진행.

---

## 2. 기술 스택
* **프론트엔드**: React (Vite 번들러 사용)
  * 가장 빠르고 안정적인 SPA(Single Page Application) 구축 환경.
* **스타일링**: Vanilla CSS (순수 CSS)
  * 별도의 프레임워크(Tailwind 등) 종속성을 피하고, CSS Modules 또는 전역 CSS를 활용해 직관적이고 커스텀하기 쉽게 구성.
* **아이콘**: Lucide React
* **데이터베이스 및 백엔드 (API)**: 구글 스프레드시트 + Google Apps Script (GAS)
  * 스프레드시트를 DB처럼 사용하며, GAS로 `GET` / `POST` 요청을 처리하는 웹 앱(API)을 배포하여 프론트엔드와 통신. 서버 유지비용 제로.

---

## 3. 폴더 구조 및 파일 구성

하나의 파일은 하나의 역할만 담당하며, 컴포넌트, 훅, 유틸, API 호출을 명확히 분리합니다.

```text
/
├── docs/                   # 기획 및 기획 관련 문서 (현재 위치)
├── src/
│   ├── api/                # API 호출 함수 (구글 Apps Script 연동 함수들)
│   │   ├── googleSheet.js
│   │   └── index.js
│   ├── components/         # 재사용 가능한 UI 컴포넌트
│   │   ├── layout/
│   │   ├── exam/           # 시험 폼 관련 컴포넌트
│   │   └── admin/          # 관리자 대시보드 컴포넌트
│   ├── hooks/              # 커스텀 훅 (비즈니스 로직, 상태 관리)
│   │   ├── useExam.js
│   │   ├── useAuth.js
│   │   └── useAdmin.js
│   ├── pages/              # 라우팅 되는 페이지 컴포넌트
│   │   ├── ExamAuth.jsx
│   │   ├── ExamForm.jsx
│   │   ├── ExamResult.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── AdminGrade.jsx
│   ├── styles/             # 순수 CSS 파일 모음
│   │   ├── global.css
│   │   ├── tokens.css      # 확정된 화이트 테마 디자인 토큰 (색상, 타이포그래피 등)
│   │   └── components/     # 각 컴포넌트별 CSS 파일
│   ├── utils/              # 헬퍼 함수, 공통 로직, 채점 로직 등
│   │   ├── grading.js
│   │   └── constants.js
│   ├── App.jsx             # 앱 진입점 및 라우팅 설정
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 4. 단계별 개발 계획 (Phases)

기능 구현은 각 Phase 단위로 진행되며, 각 Phase 완료 시 제이슨(사용자)의 테스트와 승인 후 다음 단계로 넘어갑니다.

### [Phase 1] 초기 셋업 및 디자인 시스템 확정
* **목표**: 데이터베이스(구글 시트) 기본 뼈대 구성 및 프론트엔드 디자인 시스템(화이트 테마) 확정
* **작업 내용**:
  1. 구글 스프레드시트 설계 (owners, submissions, answer_key 시트)
  2. Google Apps Script(GAS)를 이용한 데이터 CRUD API 작성 (제이슨이 직접 배포)
  3. 화이트 테마 기반의 UI 디자인 레퍼런스 제시 및 디자인 시스템(CSS Tokens) 확정
  4. 프론트엔드 프로젝트(Vite+React) 뼈대 세팅 및 Lucide 아이콘 적용 설정

### [Phase 2] 공통 레이아웃 및 컴포넌트 구현
* **목표**: 확정된 디자인 시스템 체계 하에서 화면의 기본 뼈대 구성
* **작업 내용**:
  1. `styles/tokens.css` 및 전역 스타일(`global.css`) 작성
  2. 버튼, 입력창, 모달, 아이콘 등 공통 UI 컴포넌트 개발
  3. React Router 설정 및 빈 페이지 라우팅 연결 (`/exam`, `/admin` 등)

### [Phase 3] 응시자 화면 개발 (인증, 시험, 결과)
* **목표**: 원장님이 실제로 시험을 치르는 Flow 전체 구현
* **작업 내용**:
  1. **인증**: 이메일 입력 시 `owners` 시트 데이터와 대조
  2. **시험 폼**: 40문항 렌더링, 90분 타이머 훅(`useExam.js`), 미답 검증 로직
  3. **제출 및 채점**: `answer_key` 기반 채점 로직(`utils/grading.js`) 적용 및 구글 시트 저장
  4. **결과 화면**: 채점 결과 표시

### [Phase 4] 관리자 화면 개발
* **목표**: 본사 담당자가 서술형을 채점하고 현황을 볼 수 있는 대시보드
* **작업 내용**:
  1. 관리자 간단 인증 로직 추가
  2. **응시 현황**: 응시자 목록 테이블 및 상태(채점대기/완료) 필터링 구현
  3. **서술형 채점**: 특정 응시자의 상세 페이지 접속 및 루브릭 3단계 점수 부여
  4. 점수 저장 시 총점 및 합격여부 재계산 로직 적용
