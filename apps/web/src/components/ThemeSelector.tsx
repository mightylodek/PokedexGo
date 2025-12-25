'use client';

import { useTheme } from '../contexts/ThemeContext';

export function ThemeSelector() {
  const { theme, setTheme, isHydrated } = useTheme();

  const themes = [
    { id: 'default' as const, name: 'Default', icon: '⚪' },
    { id: 'horizons' as const, name: 'Horizons', icon: '🌊' },
    { id: 'scarlet-violet' as const, name: 'Scarlet & Violet', icon: '🔴' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs theme-text-muted hidden sm:inline">Theme:</span>
      <div className="flex gap-1">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTheme(t.id);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isHydrated && theme === t.id
                ? 'theme-button-active'
                : 'theme-button-inactive'
            }`}
            title={t.name}
          >
            <span className="mr-1.5">{t.icon}</span>
            <span className="hidden md:inline">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

