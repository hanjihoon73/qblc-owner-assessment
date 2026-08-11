import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postToSheet } from '../../api/googleSheet';
import Button from '../common/Button';

export default function SubmissionTable({ submissions, onRefresh }) {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState(null); // 'retake-id' or 'set-id'

  const handleAllowRetake = async (email, name, id) => {
    if (!window.confirm(`${name}(${email}) 원장님께 재응시 권한을 부여하시겠습니까?`)) return;
    setLoadingAction(`retake-${id}`);
    try {
      const res = await postToSheet('allow_retake', { email, allow: true });
      if (res.success) {
        alert('재응시 권한이 부여되었습니다.');
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    }
    setLoadingAction(null);
  };

  const handleAssignSet = async (email, name, currentSet, id) => {
    const newSet = window.prompt(`${name}(${email}) 원장님께 배정할 세트 ID를 입력하세요 (예: A, B)`, currentSet || 'A');
    if (!newSet || newSet === currentSet) return;
    
    setLoadingAction(`set-${id}`);
    try {
      const res = await postToSheet('assign_exam_set', { email, set_id: newSet });
      if (res.success) {
        alert('세트가 변경되었습니다.');
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    }
    setLoadingAction(null);
  };

  if (!submissions || submissions.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>제출된 내역이 없습니다.</div>;
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: '#f8fafc' }}>
            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>제출일시 (소요시간)</th>
            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>이름(가맹점/이메일)</th>
            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>응시 세트</th>
            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>객+O/X</th>
            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>서술형</th>
            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>총점</th>
            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>상태</th>
            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {submissions.slice().reverse().map((sub) => {
            const dateObj = new Date(sub.submitted_at);
            const yy = String(dateObj.getFullYear()).slice(-2);
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            const dayName = days[dateObj.getDay()];
            const hh = String(dateObj.getHours()).padStart(2, '0');
            const min = String(dateObj.getMinutes()).padStart(2, '0');
            const formattedDate = `${yy}-${mm}-${dd} (${dayName}) ${hh}:${min}`;
            return (
              <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  <div>{formattedDate}</div>
                  {sub.time_taken !== undefined && sub.time_taken !== "" && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      ({Math.floor(sub.time_taken / 60)}분 {sub.time_taken % 60}초 소요)
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>{sub.examinee_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.center_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.owner_email || sub.owner_id}</div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 500 }}>Set {sub.exam_set_id || 'A'}</td>
                <td style={{ padding: '1rem' }}>{Number(sub.mc_score || 0) + Number(sub.ox_score || 0)}점</td>
                <td style={{ padding: '1rem' }}>{sub.essay_score || 0}점</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{sub.total_score || 0}점</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '999px', 
                    fontSize: '0.85rem',
                    backgroundColor: sub.pass_status === '합격' ? '#dcfce7' : sub.pass_status === '채점중' ? '#fef9c3' : '#fee2e2',
                    color: sub.pass_status === '합격' ? '#166534' : sub.pass_status === '채점중' ? '#854d0e' : '#991b1b'
                  }}>
                    {sub.pass_status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button 
                      variant="primary" 
                      onClick={() => navigate(`/admin/grade/${sub.id}`)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      채점
                    </Button>
                    <Button 
                      variant="outline" 
                      disabled={loadingAction === `retake-${sub.id}`}
                      onClick={() => handleAllowRetake(sub.owner_email || sub.owner_id, sub.examinee_name, sub.id)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      {loadingAction === `retake-${sub.id}` ? '...' : '재응시'}
                    </Button>
                    <Button 
                      variant="outline"
                      disabled={loadingAction === `set-${sub.id}`}
                      onClick={() => handleAssignSet(sub.owner_email || sub.owner_id, sub.examinee_name, sub.exam_set_id, sub.id)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      {loadingAction === `set-${sub.id}` ? '...' : '세트변경'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
