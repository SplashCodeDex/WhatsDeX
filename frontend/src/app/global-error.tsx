'use client';

/**
 * Global Error Boundary (2026 Mastermind Edition)
 * 
 * STRICT: Zero-dependency component. Do NOT import from @/components, @/stores, or any context providers.
 * This ensures the error page renders even if the root context systems fail.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          maxWidth: '400px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#1a1a1a',
          borderRadius: '1rem',
          border: '1px solid #333',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem' 
          }}>
            ⚠️
          </div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>
            Critical System Error
          </h2>
          <p style={{ 
            color: '#a1a1aa', 
            fontSize: '0.875rem', 
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            The application encountered an unrecoverable root-level exception.
          </p>
          
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#000',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: '#ef4444',
            textAlign: 'left',
            marginBottom: '1.5rem',
            overflow: 'auto',
            maxHeight: '100px',
            border: '1px solid #450a0a'
          }}>
            Error: {error?.message || "Unknown error"}
          </div>

          <button 
            onClick={() => reset()} 
            style={{ 
              backgroundColor: '#ffffff',
              color: '#000000',
              fontWeight: '600',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Restart Application
          </button>
        </div>
      </body>
    </html>
  );
}
