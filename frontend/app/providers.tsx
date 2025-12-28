'use client';

import { ThemeProvider } from '../contexts/ThemeContext';
import { Toaster } from '../components/ui/toaster';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}