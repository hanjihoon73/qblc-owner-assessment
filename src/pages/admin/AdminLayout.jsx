import { Link, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/admin', label: '대시보드 (응시 현황)' },
    { path: '/admin/questions', label: '평가 세트 관리' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      <div style={{ width: '100%', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>관리자 시스템</h2>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path}
              style={{
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: currentPath === item.path ? '600' : '400',
                backgroundColor: currentPath === item.path ? 'var(--accent-primary)' : 'transparent',
                color: currentPath === item.path ? '#fff' : 'var(--text-secondary)',
                border: currentPath === item.path ? 'none' : '1px solid var(--border-light)',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
