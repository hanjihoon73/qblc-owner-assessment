import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import { CheckCircle, Clock, CalendarDays } from 'lucide-react';
import DemoScheduleModal from '../components/exam/DemoScheduleModal';
import { postToSheet } from '../api/googleSheet';

export default function ExamResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { getOwner } = useAuth();
  const owner = getOwner();
  const [showModal, setShowModal] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isScheduled) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isScheduled]);

  // state로 전달된 result 데이터가 없으면 홈으로 (새로고침 방어 혹은 직접 접근 방지)
  const result = location.state?.result;

  if (!owner) {
    navigate('/exam');
    return null;
  }

  if (!result) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>결과 데이터를 불러올 수 없습니다.</h2>
        <Button onClick={() => navigate('/exam')} style={{ marginTop: '1rem' }}>돌아가기</Button>
      </div>
    );
  }

  const handleFinishClick = () => {
    if (!isScheduled) {
      alert("시연 테스트 일정 선택을 먼저 완료해 주세요.");
      return;
    }
    localStorage.removeItem('qblc_owner');
    navigate('/exam');
  };

  const handleScheduleConfirm = async (selectedList) => {
    setLoadingSchedule(true);
    try {
      const scheduleString = selectedList.map((item, idx) => `${idx + 1}지망: ${item.date} ${item.time}`).join('<br>');
      const payload = {
        email: owner.email,
        name: owner.name,
        center_name: owner.center_name,
        mc_score: result.mc_score,
        ox_score: result.ox_score,
        demo_schedules: scheduleString
      };
      const res = await postToSheet('schedule_demo', payload);
      if (res.success) {
        setIsScheduled(true);
        setShowModal(false);
        alert('선택하신 시연 테스트 일정이 본사로 접수되었습니다.');
      } else {
        alert(res.message || '일정 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('서버와 통신하는 도중 오류가 발생했습니다.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <CheckCircle size={48} color="var(--status-success)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: 'var(--text-2xl)' }}>제출이 완료되었습니다!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>수고하셨습니다, {owner.name} 원장님.</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>자동 채점 결과</h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>선다형 (52점 만점)</span>
          <span style={{ fontWeight: 'bold' }}>{result.mc_score} 점</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>OX형 (16점 만점)</span>
          <span style={{ fontWeight: 'bold' }}>{result.ox_score} 점</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>서술형 (32점 만점)</span>
          <span>(본사 채점 대기 중)</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
          <span>현재 총점</span>
          <span>{result.mc_score + result.ox_score} 점</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={20} />
        <p>서술형 문항은 본사 관리자가 채점한 후 최종 합격 여부가 확정됩니다.<br />최종 결과는 추후 별도 안내될 예정입니다.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem' }}>
        <Button
          onClick={() => setShowModal(true)}
          disabled={isScheduled || loadingSchedule}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CalendarDays size={18} />
          {isScheduled ? '시연 테스트 신청 완료' : '시연 테스트 일정 선택'}
        </Button>

        <Button
          variant="outline"
          onClick={handleFinishClick}
        >
          끝내기
        </Button>
      </div>

      {showModal && (
        <DemoScheduleModal
          onSelect={handleScheduleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
