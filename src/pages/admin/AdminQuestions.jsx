import { useState, useEffect } from 'react';
import { fetchFromSheet, postToSheet } from '../../api/googleSheet';
import Button from '../../components/common/Button';
import QuestionManager from '../../components/admin/QuestionManager';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSet, setCurrentSet] = useState('A'); // 빈 값이면 전체 조회로 처리 가능
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const loadQuestions = async (setId) => {
    setLoading(true);
    try {
      const res = await fetchFromSheet('get_questions', setId ? { set_id: setId } : {});
      if (res.success) {
        setQuestions(res.data || []);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('오류 발생');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions(currentSet);
  }, [currentSet]);

  const handleSave = async (formData) => {
    setIsEditing(false);
    setLoading(true);
    try {
      formData.last_modified = new Date().toISOString();
      const action = formData.id.startsWith('q') && formData.id.length > 5 ? 'add_question' : 'edit_question'; // 임시 id 구분
      const res = await postToSheet(action, { question: formData });
      if (res.success) {
        loadQuestions(currentSet);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('오류 발생');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setLoading(true);
    try {
      const res = await postToSheet('delete_question', { id });
      if (res.success) {
        loadQuestions(currentSet);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('오류 발생');
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', backgroundColor: 'var(--bg-primary)', padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>평가 세트 및 문항 관리</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>세트별로 문항을 등록하고 수정할 수 있습니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={currentSet} 
            onChange={(e) => setCurrentSet(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
          >
            <option value="A">Set A</option>
            <option value="B">Set B</option>
            <option value="">전체 문항 보기</option>
          </select>
          <Button 
            onClick={() => { setSelectedQuestion(null); setIsEditing(true); }}
            style={{ padding: '0.5rem 1rem' }}
          >
            + 새 문항 추가
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>불러오는 중...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>세트</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>번호</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>유형</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>문제 내용</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>배점</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>최종 수정 일시</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{q.set_id || '공통'}</td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{q.number}</td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    {q.type === 'MC' ? '선다형' : q.type === 'OX' ? 'OX형' : q.type === 'ESSAY' ? '서술형' : q.type}
                  </td>
                  <td style={{ padding: '1rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.text}
                  </td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{q.points}</td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#64748b' }}>
                    {q.last_modified ? (
                      (() => {
                        const d = new Date(q.last_modified);
                        const yy = String(d.getFullYear()).slice(-2);
                        const MM = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        const HH = String(d.getHours()).padStart(2, '0');
                        const mm = String(d.getMinutes()).padStart(2, '0');
                        const ss = String(d.getSeconds()).padStart(2, '0');
                        return `${yy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
                      })()
                    ) : '-'}
                  </td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="outline" onClick={() => { setSelectedQuestion(q); setIsEditing(true); }} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>수정</Button>
                      <Button variant="outline" onClick={() => handleDelete(q.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'red', borderColor: '#fca5a5' }}>삭제</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>해당 세트에 등록된 문항이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <QuestionManager 
          question={selectedQuestion} 
          onSave={handleSave} 
          onCancel={() => setIsEditing(false)} 
        />
      )}
    </div>
  );
}
