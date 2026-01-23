'use client';

import * as React from 'react';
import { z } from 'zod';

/**
 * Theme Schema (2026 Mastermind Edition)
 * Rule 1: Every interaction with external data MUST be validated via Zod.
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
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = React.useState<Theme>(defaultTheme);

    // Rule 1: Validate external data via Zod, but DO NOT do it during initial render to avoid hydration mismatch.
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

    React.useEffect(() => {
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

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = React.useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};
