import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';

export default function SubmissionDetailModal({ isOpen, onClose, submission, questions }) {
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveQuestionIdx(0);
    }
  }, [isOpen, submission]);

  if (!isOpen || !submission || !questions) return null;

  // 세트 매칭 등 현재 응시자가 풀어야 했던 문항 필터링
  const assignedQuestions = questions.filter(q => q.set_id === submission.exam_set_id || !q.set_id).sort((a, b) => a.number - b.number);

  const getQuestionStatus = (q) => {
    const userAnswer = submission[q.id];
    if (q.type === 'MC') {
      if (!userAnswer) return 'X';
      return userAnswer.startsWith(String(q.answer)) ? 'O' : 'X';
    } else if (q.type === 'OX') {
      if (!userAnswer) return 'X';
      return userAnswer === String(q.answer) ? 'O' : 'X';
    } else if (q.type === 'ESSAY') {
      let essayScores = {};
      try {
        if (submission.essay_scores) essayScores = JSON.parse(submission.essay_scores);
      } catch (e) {}
      const score = essayScores[q.id];
      if (score !== undefined && score !== null) {
        return `GRADED_${score}`;
      }
      return 'WAITING';
    }
    return '-';
  };

  const getStatusColor = (status) => {
    if (status === 'O') return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
    if (status === 'X') return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
    if (status.startsWith('GRADED')) return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
    if (status === 'WAITING') return { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' };
    return { bg: '#ffffff', text: '#000000', border: '#e5e7eb' };
  };

  const activeQuestion = assignedQuestions[activeQuestionIdx];
  const activeStatus = activeQuestion ? getQuestionStatus(activeQuestion) : null;
  
  let essayScores = {};
  try {
    if (submission.essay_scores) essayScores = JSON.parse(submission.essay_scores);
  } catch (e) {}

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '1000px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>채점 결과</h2>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {submission.examinee_name} 원장님 ({submission.center_name}) - 총점: <strong style={{ color: 'var(--primary-main)' }}>{submission.total_score}점</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={24} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Navigation Grid (Left side) */}
          <div style={{ width: '300px', borderRight: '1px solid #e5e7eb', overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f9fafb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {assignedQuestions.map((q, idx) => {
                const status = getQuestionStatus(q);
                const colors = getStatusColor(status);
                const isActive = activeQuestionIdx === idx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIdx(idx)}
                    style={{
                      aspectRatio: '1/1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `2px solid ${isActive ? '#111827' : colors.border}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.1s'
                    }}
                    title={`${q.number}번 - ${q.type === 'ESSAY' ? '서술형' : status === 'O' ? '정답' : '오답'}`}
                  >
                    {q.number}
                  </button>
                );
              })}
            </div>
            
            <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#6b7280', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '2px' }}></div> 정답
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '2px' }}></div> 오답
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '2px' }}></div> 서술형(완료)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '2px' }}></div> 서술형(대기)
              </div>
            </div>
          </div>

          {/* Question Details (Right side) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: '#fff' }}>
            {activeQuestion ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    <span style={{ color: 'var(--primary-main)', marginRight: '0.5rem' }}>Q{activeQuestion.number}.</span>
                    {activeQuestion.text}
                  </h3>
                </div>

                {activeQuestion.type === 'MC' && (
                  <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activeQuestion.options.map((opt, idx) => {
                      const prefix = ['①', '②', '③', '④'][idx];
                      const displayOpt = `${prefix} ${opt}`;
                      const isUserAnswer = submission[activeQuestion.id] === displayOpt;
                      const isCorrectAnswer = displayOpt.startsWith(String(activeQuestion.answer));
                      
                      let bgColor = '#fff';
                      let borderColor = '#e5e7eb';
                      let fontWeight = 400;
                      
                      if (isCorrectAnswer) {
                        bgColor = '#f0fdf4';
                        borderColor = '#bbf7d0';
                        fontWeight = 600;
                      } else if (isUserAnswer && !isCorrectAnswer) {
                        bgColor = '#fef2f2';
                        borderColor = '#fecaca';
                      }

                      return (
                        <div key={idx} style={{ 
                          padding: '1rem', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: bgColor,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span style={{ fontWeight }}>{displayOpt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {activeQuestion.type === 'OX' && (
                  <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    {['O', 'X'].map((opt) => {
                      const isUserAnswer = submission[activeQuestion.id] === opt;
                      const isCorrectAnswer = String(activeQuestion.answer) === opt;
                      
                      let bgColor = '#fff';
                      let borderColor = '#e5e7eb';
                      
                      if (isCorrectAnswer) {
                        bgColor = '#f0fdf4';
                        borderColor = '#bbf7d0';
                      } else if (isUserAnswer && !isCorrectAnswer) {
                        bgColor = '#fef2f2';
                        borderColor = '#fecaca';
                      }

                      return (
                        <div key={opt} style={{ 
                          flex: 1, padding: '1.5rem', borderRadius: '8px', border: `2px solid ${borderColor}`, backgroundColor: bgColor,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '2rem', fontWeight: 700, color: isCorrectAnswer ? '#166534' : (isUserAnswer ? '#991b1b' : '#374151') }}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeQuestion.type === 'ESSAY' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>제출한 답안:</div>
                      <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', whiteSpace: 'pre-wrap', minHeight: '80px' }}>
                        {submission[activeQuestion.id] || '(미입력)'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>모범 답안 및 채점 기준:</div>
                      <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', whiteSpace: 'pre-wrap', color: '#166534' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>[모범 답안]</div>
                        <div>{activeQuestion.answer || '등록되지 않음'}</div>
                        {activeQuestion.score_guide && (
                          <>
                            <div style={{ fontWeight: 600, margin: '1rem 0 0.5rem 0', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem' }}>[채점 기준]</div>
                            <div>{activeQuestion.score_guide}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Result Message for MC/OX */}
                {(activeQuestion.type === 'MC' || activeQuestion.type === 'OX') && (
                  <div style={{ 
                    padding: '1rem', borderRadius: '8px', 
                    backgroundColor: activeStatus === 'O' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${activeStatus === 'O' ? '#bbf7d0' : '#fecaca'}`,
                    color: activeStatus === 'O' ? '#166534' : '#991b1b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                    marginTop: '1rem'
                  }}>
                    {activeStatus === 'O' ? '정답입니다!' : (
                      <>
                        오답입니다. (정답: {activeQuestion.answer})
                        {!submission[activeQuestion.id] && <span style={{ marginLeft: '0.5rem', fontWeight: 400 }}>(답을 입력하지 않았어요.)</span>}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                문항을 찾을 수 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
