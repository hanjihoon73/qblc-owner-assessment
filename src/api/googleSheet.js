const API_URL = import.meta.env.VITE_GAS_API_URL;

/**
 * 구글 Apps Script로 GET 요청을 보냅니다.
 * @param {string} action - 실행할 액션 (예: 'verify_owner', 'get_submissions', 'get_answer_key')
 * @param {object} params - 쿼리 파라미터들
 * @returns {Promise<any>}
 */
export async function fetchFromSheet(action, params = {}) {
  if (!API_URL || API_URL === '여기에_배포된_웹앱_URL을_입력하세요') {
    throw new Error("환경 변수에 VITE_GAS_API_URL이 설정되지 않았습니다.");
  }

  const url = new URL(API_URL);
  url.searchParams.append('action', action);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      // CORS 문제 방지를 위해 redirect: 'follow' 등 필요할 수 있음
      redirect: 'follow',
    });
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API Error - GET ${action}]:`, error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("서버 통신 오류 (CORS). 구글 스크립트 권한 설정이나 시트 이름을 다시 확인해주세요.");
    }
    throw error;
  }
}

/**
 * 구글 Apps Script로 POST 요청을 보냅니다.
 * @param {string} action - 실행할 액션 (예: 'submit_exam', 'update_grade')
 * @param {object} payload - 저장/수정할 데이터
 * @returns {Promise<any>}
 */
export async function postToSheet(action, payload) {
  if (!API_URL || API_URL === '여기에_배포된_웹앱_URL을_입력하세요') {
    throw new Error("환경 변수에 VITE_GAS_API_URL이 설정되지 않았습니다.");
  }

  try {
    // GAS POST의 경우 text/plain으로 보내고 GAS 쪽에서 JSON.parse 처리가 가장 안정적입니다 (CORS 회피)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API Error - POST ${action}]:`, error);
    throw error;
  }
}
