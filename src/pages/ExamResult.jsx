import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import { CheckCircle, Clock } from 'lucide-react';

export default function ExamResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { getOwner } = useAuth();
  const owner = getOwner();

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
        <p>서술형 문항은 본사 관리자가 채점한 후 최종 합격 여부가 확정됩니다.<br/>최종 결과는 추후 별도 안내될 예정입니다.</p>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Button onClick={() => {
            // 로그아웃 처리 후 홈으로 (또는 닫기 안내)
            localStorage.removeItem('qblc_owner');
            navigate('/exam');
          }}
        >
          마치기
        </Button>
      </div>
    </div>
  );
}
