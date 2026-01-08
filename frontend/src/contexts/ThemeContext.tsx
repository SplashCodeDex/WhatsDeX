'use client';

import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';

export interface ThemeContextValue {
    darkMode: boolean;
    toggleDarkMode: () => void;
    mounted: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return savedTheme === 'dark' || (!savedTheme && prefersDark);
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            if (darkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }, [darkMode, mounted]);

    const toggleDarkMode = React.useCallback((): void => {
        setDarkMode((prev) => !prev);
    }, []);

    const value = useMemo(() => ({
        darkMode,
        toggleDarkMode,
        mounted
    }), [darkMode, toggleDarkMode, mounted]);

    if (!mounted) {
        return (
            <ThemeContext.Provider value={{ darkMode: true, toggleDarkMode: () => { }, mounted: false }}>
                {children}
            </ThemeContext.Provider>
        );
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = React.useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
