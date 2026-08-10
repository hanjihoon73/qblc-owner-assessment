# QBLC Owner Assessment - 디자인 시스템 (White Theme)

본 문서는 깔끔하고 가벼운 화이트 테마 기반의 UI 디자인 시스템 정의서입니다.

## 1. 색상 (Colors)

```css
:root {
  /* 배경색 (Backgrounds) */
  --bg-primary: #FFFFFF;        /* 메인 배경 (순백색) */
  --bg-secondary: #F9FAFB;      /* 서브 배경 (매우 옅은 회색, 사이드바/모달 등) */
  --bg-tertiary: #F3F4F6;       /* 강조 배경 (호버 효과 등) */

  /* 텍스트 색상 (Text) */
  --text-primary: #111827;      /* 기본 텍스트 (가독성 높은 짙은 회색/검정) */
  --text-secondary: #4B5563;    /* 보조 텍스트 (설명, 부가 정보) */
  --text-muted: #9CA3AF;        /* 비활성화 텍스트 (플레이스홀더 등) */

  /* 테두리 (Borders) */
  --border-light: #E5E7EB;      /* 기본 연한 테두리 (카드, 입력창) */
  --border-focus: #3B82F6;      /* 포커스 테두리 (파란색 포인트) */

  /* 브랜드/포인트 컬러 (Brand/Accent) */
  --accent-primary: #2563EB;    /* 주요 액션 버튼 (파란색) */
  --accent-hover: #1D4ED8;      /* 주요 액션 버튼 호버 */
  
  /* 상태 색상 (Status) */
  --status-success: #10B981;    /* 성공/합격 (초록) */
  --status-error: #EF4444;      /* 에러/불합격/미답 (빨강) */
  --status-warning: #F59E0B;    /* 경고/주의 (주황) */
}
```

## 2. 타이포그래피 (Typography)

* **기본 폰트**: 시스템 폰트 또는 'Inter', 'Pretendard' 등 모던 산세리프
* **크기 (Sizes)**:
  * `--text-xs`: 0.75rem (12px)
  * `--text-sm`: 0.875rem (14px)
  * `--text-base`: 1rem (16px) - 기본 본문
  * `--text-lg`: 1.125rem (18px)
  * `--text-xl`: 1.25rem (20px) - 섹션 제목
  * `--text-2xl`: 1.5rem (24px) - 페이지 제목

## 3. 아이콘 (Icons)

* **라이브러리**: [Lucide React](https://lucide.dev/)
* **스타일**: 미니멀한 선(Stroke) 형태 아이콘 적용. 컬러는 주로 `--text-secondary` 사용.

## 4. UI 컴포넌트 스타일링 원칙

* **버튼 (Buttons)**: 둥근 모서리(`border-radius: 6px` 또는 `8px`), 부드러운 호버 트랜지션.
* **카드 (Cards)**: 순백색 배경(`--bg-primary`), 매우 옅은 그림자(`box-shadow: 0 1px 3px rgba(0,0,0,0.1)`), 연한 테두리(`--border-light`).
* **입력 폼 (Inputs)**: 포커스 시 `--border-focus` 색상의 아웃라인 효과 적용.
