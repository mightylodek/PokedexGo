'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { getStoredTheme, setStoredTheme, applyTheme, getAppliedTheme, Theme } from '../lib/theme-utils';

export type { Theme };

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always initialize to 'default' to avoid hydration mismatch
  // We'll update it after hydration completes
  const [theme, setThemeState] = useState<Theme>('default');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Track if we've done the initial sync
  const hasInitialized = useRef(false);

  // Mark as hydrated and sync with DOM/storage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitialized.current) {
      hasInitialized.current = true;
      setIsHydrated(true);
      
      // Read from DOM attribute (set by inline script before hydration)
      // This is the source of truth for what's actually applied
      const appliedTheme = getAppliedTheme();
      
      // Update state to match what's actually on the DOM
      // This ensures the UI buttons reflect the correct selection
      setThemeState(appliedTheme);
      applyTheme(appliedTheme);
    }
  }, []);

  // Apply theme on mount and whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      applyTheme(theme);
    }
  }, [theme, isHydrated]);

  const setTheme = useCallback((newTheme: Theme) => {
    // Always update state, storage, and DOM
    setThemeState(newTheme);
    setStoredTheme(newTheme);
    applyTheme(newTheme);
  }, []);

  // Create context value - don't memoize to ensure updates are always detected
  const contextValue = {
    theme,
    setTheme,
    isHydrated,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

