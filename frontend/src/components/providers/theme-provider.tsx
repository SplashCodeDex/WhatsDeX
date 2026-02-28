'use client';

import * as React from 'react';
import { z } from 'zod';

/**
 * Theme Schema (2026 Mastermind Edition)
 */
const themeSchema = z.enum(['dark', 'light', 'system']);
type Theme = z.infer<typeof themeSchema>;

interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
    theme: 'system',
    setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'whatsdex-theme',
}: ThemeProviderProps) {
    const [theme, setTheme] = React.useState<Theme>(defaultTheme);

    // Hydration Logic: Read from localStorage strictly in useEffect
    React.useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const validated = themeSchema.parse(stored);
                setTheme(validated);
            }
        } catch (error) {
            console.error('[ThemeProvider] Failed to parse stored theme:', error);
        }
    }, [storageKey]);

    // Apply classes to document element
    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';

            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
    }, [theme]);

    const value = React.useMemo(
        () => ({
            theme,
            setTheme: (newTheme: Theme) => {
                localStorage.setItem(storageKey, newTheme);
                setTheme(newTheme);
            },
        }),
        [theme, storageKey]
    );

    // React 19: Use Context directly as provider
    return (
        <ThemeProviderContext value={value}>
            {children}
        </ThemeProviderContext>
    );
}

export const useTheme = () => {
    const context = React.useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};
