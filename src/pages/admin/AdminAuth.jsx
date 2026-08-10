import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postToSheet } from '../../api/googleSheet';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 코드 입력
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestAuth = async (e) => {
    e.preventDefault();
    if (!email.endsWith('@quebon.com')) {
      alert('깨봉 사내 이메일(@quebon.com)만 접근 가능합니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await postToSheet('request_admin_auth', { email });
      if (res.success) {
        alert(res.message);
        setStep(2);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('인증 메일 발송 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  const handleVerifyAuth = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      alert('6자리 인증 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await postToSheet('verify_admin_auth', { email, code });
      if (res.success) {
        localStorage.setItem('isAdminAuthenticated', 'true');
        alert('인증이 완료되었습니다.');
        navigate('/admin', { replace: true });
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('인증 확인 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--bg-primary)', padding: '3rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>관리자 시스템 로그인</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          {step === 1 ? '사내 이메일(@quebon.com)을 입력하시면 인증 메일이 발송됩니다.' : '이메일로 발송된 6자리 인증 번호를 입력해 주세요.'}
        </p>

        {step === 1 ? (
          <form onSubmit={handleRequestAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@quebon.com"
              required
              disabled={loading}
              style={{ textAlign: 'center' }}
            />
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? '발송 중...' : '인증받기'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '0.5rem' }}>{email}</div>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="인증 번호 6자리"
              maxLength={6}
              required
              disabled={loading}
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
            />
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? '인증 중...' : '로그인'}
            </Button>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'underline', marginTop: '1rem', cursor: 'pointer' }}
              disabled={loading}
            >
              이메일 다시 입력하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
