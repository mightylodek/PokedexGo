'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SettingsModal } from './SettingsModal';
import { useTheme } from '../contexts/ThemeContext';
import { getApiUrl } from '../lib/api-utils';

export function AppHeader() {
  const router = useRouter();
  const { setTheme, isHydrated } = useTheme();
  const [user, setUser] = useState<{ email: string; displayName?: string; theme?: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        
        // Load user theme preference if available and hydrated
        if (parsedUser?.theme && isHydrated) {
          setTheme(parsedUser.theme);
        }
      } catch {
        setUser(null);
      }
    }
  }, [isHydrated, setTheme]);

  // Load theme preference from backend if user is authenticated
  useEffect(() => {
    const loadUserPreferences = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && isHydrated) {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/auth/preferences`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const prefs = await response.json();
            if (prefs.theme) {
              setTheme(prefs.theme);
              // Update stored user object
              const userStr = localStorage.getItem('user');
              if (userStr) {
                try {
                  const parsedUser = JSON.parse(userStr);
                  parsedUser.theme = prefs.theme;
                  localStorage.setItem('user', JSON.stringify(parsedUser));
                  setUser(parsedUser);
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }
        } catch (error) {
          // Silently fail - user might not be logged in or API might be unavailable
          console.debug('Could not load user preferences:', error);
        }
      }
    };

    loadUserPreferences();
  }, [isAuthenticated, isHydrated, setTheme]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/');
  };

  return (
    <header className="theme-bg-secondary theme-border border-b sticky top-0 z-50 theme-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold theme-text-primary hover:opacity-80 transition">
            Pokédex GO
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/catalog" className="theme-text-secondary hover:theme-text-primary transition">
              Pokemon
            </Link>
            <Link href="/items" className="theme-text-secondary hover:theme-text-primary transition">
              Items
            </Link>
            <Link href="/ingestion" className="theme-text-secondary hover:theme-text-primary transition">
              Ingestion
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm theme-text-secondary">
                  {user?.displayName || user?.email || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm theme-text-secondary hover:theme-text-primary transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="theme-text-secondary hover:theme-text-primary transition">
                Login
              </Link>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 theme-text-secondary hover:theme-text-primary transition rounded-md hover:theme-bg-hover"
              aria-label="Settings"
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => {
          // Theme is already saved in the modal
        }}
      />
    </header>
  );
}

