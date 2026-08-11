import fs from 'fs';
import path from 'path';

// Get API URL from .env
const envPath = 'd:\\SynologyDrive\\dev_projects\\qblc-owner-assessment\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const apiUrlMatch = envContent.match(/VITE_GAS_API_URL=(.+)/);
const apiUrl = apiUrlMatch ? apiUrlMatch[1].trim() : null;

if (!apiUrl) {
  console.error("API URL not found in .env");
  process.exit(1);
}

const rubrics = {
  8: "- 방향 질문 (3점): \"나눗셈이 뭘 하는 건지 생각해볼까?\" 등 탐색 유도 질문\n- 연결 질문 (4점): \"피자를 1/2로 나눈다면 몇 조각이 될까?\" 등 시각적·경험적 연결\n- 확인 질문 (3점): \"그러면 왜 뒤집어서 곱하는 건지 네 말로 설명해볼래?\" 등 이해도 확인",
  9: "- 수학 교육 시장 문제점 언급 (3점): 공식 암기·반복 훈련 중심, 개념 이해 없는 학습\n- 시각화의 교육적 효과 (4점): 추상적 개념을 직관적으로 이해, Aha Moment 경험\n- 깨봉 교육 철학과의 연결 (3점): True Pleasure from True Learning, 레벨 3 도달",
  10: "- 레벨 1 설명 (2점): 공식 암기·유형 반복 (가짜수학)\n- 레벨 2 설명 (2점): 패턴 인식·데이터 기반 (AI 수준)\n- 레벨 3 설명 (3점): 개념 본질 파악, 새로운 문제도 스스로 해결 (진짜수학)\n- 레벨 3 지향 이유 (3점): 진짜 수학적 사고력, 변화하는 시대에 필요한 역량",
  16: "- 코어 A~C 교재 (3점): 체크업북 O + 워크북 O\n- 코어 D~E 교재 (2점): 체크업북 X + 워크북 O\n- 어드밴스드/엘리트 교재 (2점): 체크업북 O + 워크북 X\n- 추가 학습 활동 차이 (3점): 어드밴스드/엘리트는 복습 문제 풀기 + 실전 연습 문제 추가, 원생 채점 ON/OFF 가능",
  25: "- 챕터 테스트 시점 (2점): 해당 챕터 마지막 레슨 완료 후\n- 누적 테스트 시점 (3점): 3n+1번 챕터의 진도 레슨 3개 완료 후\n- 평가 범위 차이 (2점): 챕터 테스트는 해당 챕터, 누적 테스트는 이전 챕터까지 누적\n- 교육적 의의 (3점): 장기 기억 확인, 이전 학습 내용 복습 효과, 약점 레슨 파악",
  26: "- 3요소와 비율 (4점): 퀴즈 정답률 50% + 빌드업 채점 30% + 핵심 체크 20%\n- 점수 범위 (2점): 1~5점 척도\n- 강점/약점 기준 (2점): 80% 이상 = 강점, 50% 이하 = 약점\n- 활용 방안 (2점): 약점 레슨 복습 지정, 학부모 상담 근거 자료",
  39: "- 시각화 언급 (3점): 수학을 시각적으로 체험하여 흥미 유발\n- Aha Moment (3점): 이해의 즐거움으로 수학에 대한 태도 변화\n- 콘텐츠+코칭 (2점): 강의식이 아닌 콘텐츠 기반 자기주도 + 코칭 지원\n- 구체성·설득력 (2점): 실제 상담에 사용할 수 있는 자연스러운 화법",
  40: "- 콘텐츠 영상 복습 안내 (3점): 학습한 레슨 영상 재시청\n- 복습 레슨 활용 (3점): 약점으로 표시된 레슨 복습 지정 기능 안내\n- 성장 알림 활용 (2점): 학부모가 성장 알림으로 학습 현황 확인하며 격려\n- 가정 학습 태도 조언 (2점): 결과보다 과정 격려, 아이 스스로 설명하게 하기"
};

async function updateRubrics() {
  console.log("Fetching questions...");
  const res = await fetch(`${apiUrl}?action=get_questions`);
  const data = await res.json();
  
  if (!data.success) {
    console.error("Failed to fetch questions", data);
    return;
  }
  
  const questions = data.data;
  let updatedCount = 0;
  
  for (const q of questions) {
    if (q.type === 'ESSAY' && rubrics[q.number]) {
      console.log(`Updating Q${q.number} (ID: ${q.id})...`);
      const updateRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_question',
          question: {
            id: q.id,
            answer: rubrics[q.number]
          }
        })
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        console.log(`Success: Q${q.number}`);
        updatedCount++;
      } else {
        console.error(`Failed: Q${q.number}`, updateData);
      }
    }
  }
  
  console.log(`Finished updating ${updatedCount} rubrics.`);
}

updateRubrics();
