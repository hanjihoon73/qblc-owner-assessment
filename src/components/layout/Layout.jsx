import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';

export default function Layout({ children }) {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.title = '깨봉수학 러닝센터 평가 어드민';
    } else {
      document.title = '깨봉수학 러닝센터 원장 평가';
    }
  }, [location]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main className="container" style={{ flex: 1, padding: '2rem 1rem' }}>
        {children}
      </main>
      <footer style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
        © {new Date().getFullYear()} EQUALKEY Co., Ltd. All rights reserved.
      </footer>
    </div>
  );
}
