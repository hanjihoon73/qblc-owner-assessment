import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postToSheet } from '../../api/googleSheet';
import Button from '../common/Button';
import { MoreVertical } from 'lucide-react';
import SubmissionDetailModal from './SubmissionDetailModal';

export default function SubmissionTable({ submissions, questions, onRefresh }) {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState(null); // 'retake-id' or 'set-id'
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  // Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAllowRetake = async (email, name, id) => {
    setOpenDropdownId(null);
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
    setOpenDropdownId(null);
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

  const handleDelete = async (id, name, dateObj) => {
    setOpenDropdownId(null);
    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
    if (!window.confirm(`정말 삭제하시겠습니까?\n[${name}] 원장님의 ${dateStr} 제출 내역이 영구적으로 삭제됩니다.`)) return;
    
    setLoadingAction(`delete-${id}`);
    try {
      const res = await postToSheet('delete_submission', { id });
      if (res.success) {
        alert('삭제되었습니다.');
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
    setLoadingAction(null);
  };

  if (!submissions || submissions.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>제출된 내역이 없습니다.</div>;
  }

  return (
    <>
      <div style={{ overflow: 'visible', marginTop: '1rem', paddingBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>제출일시 (소요시간)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>이름(가맹점/이메일)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>응시 세트</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>선다+OX</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>서술형</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>총점</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>상태</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>관리</th>
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
              
              const isDropdownOpen = openDropdownId === sub.id;

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
                  <td style={{ padding: '1rem', textAlign: 'center', position: 'relative' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(isDropdownOpen ? null : sub.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                    >
                      <MoreVertical size={20} color="#64748b" />
                    </button>

                    {isDropdownOpen && (
                      <div 
                        ref={dropdownRef}
                        style={{
                          position: 'absolute',
                          right: '1rem',
                          top: '3rem',
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          zIndex: 10,
                          minWidth: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '0.5rem 0',
                          textAlign: 'left'
                        }}
                      >
                        <button 
                          onClick={() => navigate(`/admin/grade/${sub.id}`)}
                          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--primary-main)', fontWeight: 600 }}
                        >
                          채점
                        </button>
                        <button 
                          onClick={() => { setOpenDropdownId(null); setSelectedSubmission(sub); }}
                          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: '#10b981', fontWeight: 600 }}
                        >
                          결과보기
                        </button>
                        <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.25rem 0' }}></div>
                        <button 
                          disabled={loadingAction === `retake-${sub.id}`}
                          onClick={() => handleAllowRetake(sub.owner_email || sub.owner_id, sub.examinee_name, sub.id)}
                          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                        >
                          {loadingAction === `retake-${sub.id}` ? '...' : '재응시 권한부여'}
                        </button>
                        <button 
                          disabled={loadingAction === `set-${sub.id}`}
                          onClick={() => handleAssignSet(sub.owner_email || sub.owner_id, sub.examinee_name, sub.exam_set_id, sub.id)}
                          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                        >
                          {loadingAction === `set-${sub.id}` ? '...' : '세트 변경'}
                        </button>
                        <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.25rem 0' }}></div>
                        <button 
                          disabled={loadingAction === `delete-${sub.id}`}
                          onClick={() => handleDelete(sub.id, sub.examinee_name, dateObj)}
                          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: '#ef4444' }}
                        >
                          {loadingAction === `delete-${sub.id}` ? '...' : '삭제'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SubmissionDetailModal 
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission}
        questions={questions}
      />
    </>
  );
}
