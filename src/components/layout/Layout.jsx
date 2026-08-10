import Header from './Header';

export default function Layout({ children }) {
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
