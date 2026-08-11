import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function ExamAuth() {
  const [email, setEmail] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    const success = await login(email);
    if (success) {
      // 인증 성공 시 시험 화면으로 이동
      navigate('/exam/take'); 
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '3rem', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: 'var(--text-xl)' }}>원장 인증</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
          등록된 이메일을 입력하여 시험을 시작하세요.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input 
            label="이메일 주소"
            id="email"
            type="email"
            placeholder="example@qblc.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {error && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading || !email}>
            {loading ? '인증 중...' : '시험 시작하기'}
          </Button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            type="button"
            onClick={() => window.open('/admin', '_blank', 'noopener,noreferrer')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              textDecoration: 'underline',
              padding: '0.5rem'
            }}
          >
            어드민
          </button>
        </div>
      </div>
    </div>
  );
}
