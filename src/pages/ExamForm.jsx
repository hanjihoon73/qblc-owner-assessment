import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExam } from '../hooks/useExam';
import { SECTIONS } from '../utils/constants';
import { submitExam } from '../utils/grading';
import Button from '../components/common/Button';
import { Clock, Loader2 } from 'lucide-react';

export default function ExamForm() {
  const { getOwner } = useAuth();
  const owner = getOwner();
  const navigate = useNavigate();

  const {
    questions,
    isLoadingQuestions,
    answers,
    handleAnswerChange,
    timeLeft,
    formatTime,
    getUnansweredQuestions,
    isSubmitting,
    setIsSubmitting
  } = useExam(owner?.assigned_set_id);

  // 로그인하지 않은 사용자는 튕겨냄
  useEffect(() => {
    if (!owner) {
      navigate('/exam');
    }
  }, [owner, navigate]);

  // 시간 초과 시 자동 제출
  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitting && owner) {
      alert("시험 시간이 종료되어 자동 제출됩니다.");
      handleSubmit(new Event('submit'));
    }
  }, [timeLeft]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    // 미답 체크 (자발적 제출인 경우에만 경고)
    const unanswered = getUnansweredQuestions();
    if (timeLeft > 0 && unanswered.length > 0) {
      const confirmSubmit = window.confirm(
        `아직 작성하지 않은 문항이 ${unanswered.length}개 있습니다. (${unanswered.join(', ')})\n정말 제출하시겠습니까?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    try {
      const timeTaken = 5400 - timeLeft;
      const result = await submitExam(owner, answers, timeTaken);
      alert("제출이 완료되었습니다.");
      navigate(`/result/${result.id}`, { state: { result } });
    } catch (err) {
      alert(`제출 중 오류가 발생했습니다: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  if (!owner) return null;

  if (isLoadingQuestions) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={48} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
        <p>문항 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', backgroundColor: '#1D4ED8', color: 'white', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 10px -1px rgba(0, 0, 0, 0.3)', position: 'sticky', top: '70px', zIndex: 5 }}>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{owner.name}</span> 원장님 ({owner.center_name})
          <span style={{ fontSize: '0.9rem', opacity: 0.8, marginLeft: '0.75rem' }}>{owner.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft < 300 ? '#FF8A8A' : 'white', fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>
          <Clock size={20} />
          {formatTime()}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {SECTIONS.map(sec => (
          <div key={sec.id} style={{ marginBottom: '3rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
              {sec.title}
            </h3>

            {questions.filter(q => q.section_id === sec.id).sort((a, b) => a.number - b.number).map(q => (
              <div key={q.id} style={{ backgroundColor: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
                <div style={{ fontWeight: '500', marginBottom: '1rem', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginRight: '0.5rem' }}>
                    {String(q.number).padStart(2, '0')}.
                  </span>
                  {q.text}
                </div>

                {q.type === 'MC' || q.type === 'OX' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {q.options.map((opt, idx) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    style={{ width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)', resize: 'vertical' }}
                    placeholder="답안을 서술해 주세요."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Button type="submit" disabled={isSubmitting} style={{ padding: '1rem 3rem', fontSize: 'var(--text-lg)' }}>
            {isSubmitting ? '제출 및 채점 중...' : '최종 제출하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
