'use client';

import { ThemeProvider } from '../contexts/ThemeContext';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}