export type Theme = 'default' | 'horizons' | 'scarlet-violet';

const THEME_STORAGE_KEY = 'pokedex-theme';
const THEME_COOKIE_KEY = 'pokedex-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'default';
  }

  // Try localStorage first
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isValidTheme(stored)) {
      return stored as Theme;
    }
  } catch (e) {
    // localStorage might not be available
  }

  // Try cookie as fallback
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === THEME_COOKIE_KEY && value && isValidTheme(value)) {
        return decodeURIComponent(value) as Theme;
      }
    }
  } catch (e) {
    // Cookie parsing failed
  }

  return 'default';
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Store in localStorage
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // localStorage might not be available
  }

  // Store in cookie as backup (expires in 1 year)
  try {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${THEME_COOKIE_KEY}=${encodeURIComponent(theme)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (e) {
    // Cookie setting failed
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
}

export function isValidTheme(value: string): boolean {
  return ['default', 'horizons', 'scarlet-violet'].includes(value);
}

export function getAppliedTheme(): Theme {
  if (typeof document === 'undefined') {
    return 'default';
  }
  const appliedTheme = document.documentElement.getAttribute('data-theme');
  if (appliedTheme && isValidTheme(appliedTheme)) {
    return appliedTheme as Theme;
  }
  return 'default';
}

// Script to run before React hydration to prevent flash
export function getThemeInitScript(): string {
  return `
    (function() {
      try {
        var theme = localStorage.getItem('pokedex-theme') || 'default';
        if (!['default', 'horizons', 'scarlet-violet'].includes(theme)) {
          theme = 'default';
        }
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'default');
      }
    })();
  `;
}

