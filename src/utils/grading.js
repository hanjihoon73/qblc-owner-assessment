import { postToSheet } from '../api/googleSheet';

export async function submitExam(ownerData, answers, timeTaken) {
  // 백엔드(GAS)에서 직접 채점하도록 구조 변경됨
  // 1. 제출 데이터 조립 (answers 객체만 전송, 나머지 처리는 백엔드가 수행)
  const payload = {
    ownerData,
    answers,
    timeTaken
  };

  // 2. 구글 시트로 POST 요청 (채점 및 submissions 시트 저장)
  const postResponse = await postToSheet('submit_exam', { data: payload });
  if (!postResponse.success) {
    throw new Error(postResponse.message || "제출 및 채점에 실패했습니다.");
  }

  // 백엔드에서 채점된 최종 데이터 반환 (결과 화면 표시용)
  return postResponse.data;
}
