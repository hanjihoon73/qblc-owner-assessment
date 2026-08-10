import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFromSheet, postToSheet } from '../../api/googleSheet';
import Button from '../../components/common/Button';

export default function AdminGrade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [essayScores, setEssayScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [subRes, qRes] = await Promise.all([
          fetchFromSheet('get_submissions'),
          fetchFromSheet('get_questions') // 어드민이라 전체 문항을 다 가져옴
        ]);
        
        if (subRes.success && qRes.success) {
          const sub = subRes.data.find(s => s.id === id);
          setSubmission(sub);
          setQuestions(qRes.data);
          
          if (sub && sub.essay_scores) {
            try {
              setEssayScores(JSON.parse(sub.essay_scores));
            } catch (e) {
              setEssayScores({});
            }
          }
        }
      } catch (err) {
        alert('데이터 로딩 중 오류 발생');
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>불러오는 중...</div>;
  if (!submission) return <div style={{ padding: '3rem', textAlign: 'center' }}>제출 내역을 찾을 수 없습니다.</div>;

  const essayQuestions = questions.filter(q => q.type === 'ESSAY' && (q.set_id === submission.exam_set_id || !q.set_id));
  
  const handleScoreChange = (qId, score) => {
    setEssayScores(prev => ({ ...prev, [qId]: score }));
  };

  const handleSubmitGrade = async () => {
    if (!window.confirm('채점을 완료하시겠습니까?')) return;
    
    setSubmitting(true);
    let totalEssayScore = 0;
    Object.values(essayScores).forEach(score => {
      totalEssayScore += Number(score || 0);
    });

    const mcOxScore = Number(submission.mc_score || 0) + Number(submission.ox_score || 0);
    const finalTotalScore = mcOxScore + totalEssayScore;
    const finalPassStatus = finalTotalScore >= 64 ? '합격' : '불합격';

    try {
      const res = await postToSheet('update_grade', {
        id: submission.id,
        updates: {
          essay_scores: JSON.stringify(essayScores),
          essay_score: totalEssayScore,
          total_score: finalTotalScore,
          pass_status: finalPassStatus
        }
      });

      if (res.success) {
        alert(`채점이 완료되었습니다.\n총점: ${finalTotalScore}점 (${finalPassStatus})`);
        navigate('/admin');
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    }
    setSubmitting(false);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>서술형 답안 채점</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{submission.examinee_name} 원장님 ({submission.center_name}) - Set {submission.exam_set_id || 'A'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>객관식/OX 점수</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-main)' }}>
            {Number(submission.mc_score || 0) + Number(submission.ox_score || 0)}점
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
        {essayQuestions.map((q, idx) => (
          <div key={q.id} style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              Q{q.number}. {q.text}
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>제출한 답안:</div>
              <div style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', whiteSpace: 'pre-wrap', minHeight: '60px' }}>
                {submission[q.id] || '(미입력)'}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>모범 답안 및 채점 기준:</div>
              <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#166534' }}>
                {q.answer || '채점 기준이 등록되지 않았습니다.'}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>루브릭 채점:</strong>
              {[
                { label: '부족 (1점)', value: 1, color: '#fecaca', active: '#ef4444' },
                { label: '보통 (2점)', value: 2, color: '#fef08a', active: '#eab308' },
                { label: '우수 (3점)', value: 3, color: '#bbf7d0', active: '#22c55e' }
              ].map(rubric => (
                <button
                  key={rubric.value}
                  onClick={() => handleScoreChange(q.id, rubric.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: essayScores[q.id] === rubric.value ? rubric.active : '#f8fafc',
                    color: essayScores[q.id] === rubric.value ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: essayScores[q.id] === rubric.value ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {rubric.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {essayQuestions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>이 세트에는 서술형 문항이 없습니다.</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '2px solid #cbd5e1' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>최종 계산될 총점: </span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--primary-main)', marginLeft: '0.5rem' }}>
            {Number(submission.mc_score || 0) + Number(submission.ox_score || 0) + Object.values(essayScores).reduce((sum, s) => sum + Number(s || 0), 0)} / 80
          </strong>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>(합격 기준: 64점)</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="outline" onClick={() => navigate('/admin')}>취소</Button>
          <Button onClick={handleSubmitGrade} disabled={submitting}>
            {submitting ? '처리 중...' : '최종 채점 완료'}
          </Button>
        </div>
      </div>
    </div>
  );
}
