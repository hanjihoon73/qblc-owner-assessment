import { useState, useCallback } from 'react';
import { fetchFromSheet } from '../api/googleSheet';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 간단한 전역 상태 대신 localStorage 사용 (페이지 새로고침 유지)
  const getOwner = useCallback(() => {
    const data = localStorage.getItem('qblc_owner');
    return data ? JSON.parse(data) : null;
  }, []);

  const login = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFromSheet('verify_owner', { email });
      if (response.success && response.data) {
        localStorage.setItem('qblc_owner', JSON.stringify(response.data));
        return true;
      } else {
        if (response.code === 'ALREADY_SUBMITTED') {
          setError('이미 평가를 완료하셨습니다. 재응시가 필요한 경우 본사로 문의해 주세요.');
        } else {
          setError(response.message || '인증에 실패했습니다.');
        }
        return false;
      }
    } catch (err) {
      setError(err.message || '서버와 통신 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('qblc_owner');
  }, []);

  return { getOwner, login, logout, loading, error };
}
