export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>404</h1>
          <p style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Page Not Found</p>
          <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
          <a
            href="/"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Go back home
          </a>
        </div>
      </body>
    </html>
  );
}
