'use client';

import { ThemeProvider } from '../contexts/ThemeContext';
import { Toaster } from '../components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
