'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { getApiUrl } from '../lib/api-utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const { theme, setTheme, isHydrated } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<Theme>(theme);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize preview theme when modal opens
  useEffect(() => {
    if (isOpen && isHydrated) {
      setPreviewTheme(theme);
    }
  }, [isOpen, theme, isHydrated]);

  // Apply preview theme immediately when it changes
  useEffect(() => {
    if (isOpen && isHydrated) {
      const root = document.documentElement;
      root.setAttribute('data-theme', previewTheme);
    }
  }, [previewTheme, isOpen, isHydrated]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const themes = [
    { id: 'default' as const, name: 'Default', icon: '⚪' },
    { id: 'horizons' as const, name: 'Horizons', icon: '🌊' },
    { id: 'scarlet-violet' as const, name: 'Scarlet & Violet', icon: '🔴' },
  ];

  const handleCancel = () => {
    // Restore original theme
    if (isHydrated) {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
    }
    onClose();
  };

  const handleOk = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = getApiUrl();

      if (token) {
        try {
          // Save to backend
          const response = await fetch(`${apiUrl}/auth/preferences/theme`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ theme: previewTheme }),
          });

          if (!response.ok) {
            let errorMessage = 'Failed to save theme preference';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              // If response is not JSON, use status text
              errorMessage = response.statusText || errorMessage;
            }
            
            // Log the error but don't throw - we'll still save locally
            console.warn(`Theme preference save failed: ${errorMessage} (Status: ${response.status})`);
            
            // If it's an authentication error, the token might be invalid
            if (response.status === 401 || response.status === 403) {
              console.warn('Authentication failed - theme will be saved locally only');
            }
          } else {
            // Update user object in localStorage on successful save
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const parsedUser = JSON.parse(userStr);
                parsedUser.theme = previewTheme;
                localStorage.setItem('user', JSON.stringify(parsedUser));
              } catch {
                // Ignore parse errors
              }
            }
          }
        } catch (fetchError) {
          // Network error or other fetch error
          console.warn('Network error saving theme preference:', fetchError);
          // Continue to save locally
        }
      }

      // Update the actual theme (always happens, even if backend save fails)
      setTheme(previewTheme);
      onSave();
      onClose();
    } catch (error) {
      console.error('Unexpected error saving theme preference:', error);
      // Still update the theme locally even if something unexpected fails
      setTheme(previewTheme);
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        ref={modalRef}
        className="theme-bg-card rounded-lg theme-shadow border theme-border max-w-md w-full"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b theme-border">
          <h2 className="text-xl font-semibold theme-text-primary">Settings</h2>
          <button
            onClick={handleCancel}
            className="text-2xl leading-none theme-text-secondary hover:theme-text-primary transition"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium theme-text-primary mb-3">
              Theme
            </label>
            <div className="flex gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPreviewTheme(t.id)}
                  className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all border ${
                    previewTheme === t.id
                      ? 'theme-button-active border-2'
                      : 'theme-button-inactive theme-border'
                  }`}
                  style={{
                    borderColor: previewTheme === t.id ? 'var(--accent-primary)' : 'var(--border-color)',
                  }}
                >
                  <span className="mr-2">{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t theme-border">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-md text-sm font-medium theme-text-secondary hover:theme-text-primary transition"
          >
            Cancel
          </button>
          <button
            onClick={handleOk}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-medium theme-button-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Ok'}
          </button>
        </div>
      </div>
    </div>
  );
}

