'use client';

export const dynamic = "force-dynamic";

import { Providers } from './providers';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <Providers>
          <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', color: '#000' }}>
            <h2>Something went wrong!</h2>
            <button onClick={() => reset()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#000', color: '#fff' }}>Try again</button>
          </div>
        </Providers>
      </body>
    </html>
  );
}
