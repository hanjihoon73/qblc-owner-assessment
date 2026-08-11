import { useState, useEffect } from 'react';
import { fetchFromSheet, postToSheet } from '../../api/googleSheet';
import SubmissionTable from '../../components/admin/SubmissionTable';
import Button from '../../components/common/Button';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSet, setActiveSet] = useState('A');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, setRes] = await Promise.all([
        fetchFromSheet('get_submissions'),
        fetchFromSheet('get_settings')
      ]);
      
      if (subRes.success) {
        setSubmissions(subRes.data);
      } else {
        setError(subRes.message || '데이터를 불러오지 못했습니다.');
      }

      if (setRes.success && setRes.data) {
        setActiveSet(setRes.data.active_exam_set || 'A');
      }
    } catch (err) {
      setError('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChangeActiveSet = async () => {
    const newSet = window.prompt('현재 전체 원장님께 공통으로 배정되는 활성 세트를 입력하세요.', activeSet);
    if (!newSet || newSet === activeSet) return;
    
    try {
      const res = await postToSheet('update_settings', { key: 'active_exam_set', value: newSet });
      if (res.success) {
        setActiveSet(newSet);
        alert(`활성 세트가 ${newSet}로 변경되었습니다.`);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('설정 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ width: '100%', backgroundColor: 'var(--bg-primary)', padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>응시 현황 관리</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>전체 응시자의 제출 내역과 점수를 확인하고 재응시 및 세트를 관리합니다.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f0fdf4', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div>
            <span style={{ fontSize: '0.9rem', color: '#166534', marginRight: '0.5rem' }}>현재 전체 배정 세트:</span>
            <strong style={{ fontSize: '1.2rem', color: '#15803d' }}>Set {activeSet}</strong>
          </div>
          <Button variant="outline" onClick={handleChangeActiveSet} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderColor: '#86efac', color: '#166534' }}>
            변경
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>데이터를 불러오는 중입니다...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--status-error)' }}>{error}</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>총 {submissions.length}건의 제출 내역</div>
            <Button variant="outline" onClick={loadData}>새로고침</Button>
          </div>
          <SubmissionTable submissions={submissions} onRefresh={loadData} />
        </>
      )}
    </div>
  );
}
