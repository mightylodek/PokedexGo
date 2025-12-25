'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../../lib/api-utils';
import { useTheme } from '../../contexts/ThemeContext';

export default function RegisterPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const apiUrl = getApiUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          displayName: displayName || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Auto-login after registration
        setTimeout(async () => {
          try {
            const loginRes = await fetch(`${apiUrl}/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            if (loginRes.ok) {
              const data = await loginRes.json();
              localStorage.setItem('accessToken', data.accessToken);
              localStorage.setItem('refreshToken', data.refreshToken);
              localStorage.setItem('user', JSON.stringify(data.user));
              
              // Load user theme preference if available
              if (data.user?.theme) {
                setTheme(data.user.theme);
              }
              
              router.push('/ingestion');
            } else {
              // Registration succeeded but auto-login failed, redirect to login
              router.push('/login');
            }
          } catch {
            router.push('/login');
          }
        }, 1000);
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Registration failed' }));
        setError(errorData.message || 'Registration failed. Email may already be in use.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const apiDisplay = apiUrl || (typeof window !== 'undefined' ? window.location.origin : 'the server');
      setError(`Network error: ${errorMessage}. Please check if the API server is running on ${apiDisplay}`);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="theme-bg-card rounded-lg theme-shadow p-8 border theme-border">
          <h1 className="text-3xl font-bold mb-2 theme-text-primary">Register</h1>
          <p className="theme-text-secondary mb-6">
            Create an account to access data ingestion and other features
          </p>

          {error && (
            <div className="mb-4 p-3 rounded border" style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: 'var(--accent-primary)'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded border" style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.1)', 
              borderColor: 'rgba(34, 197, 94, 0.3)',
              color: 'rgb(34, 197, 94)'
            }}>
              Registration successful! Logging you in...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium theme-text-secondary mb-1">
                Display Name (Optional)
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 rounded border theme-border theme-bg-secondary theme-text-primary focus:outline-none focus:ring-2 focus:ring-opacity-50"
                placeholder="Your name"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium theme-text-secondary mb-1">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded border theme-border theme-bg-secondary theme-text-primary focus:outline-none focus:ring-2 focus:ring-opacity-50"
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium theme-text-secondary mb-1">
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded border theme-border theme-bg-secondary theme-text-primary focus:outline-none focus:ring-2 focus:ring-opacity-50"
                placeholder="At least 6 characters"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: (loading || success) ? 'var(--bg-hover)' : 'var(--accent-primary)', 
                color: 'white'
              }}
            >
              {loading ? 'Registering...' : success ? 'Success!' : 'Register'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t theme-border">
            <p className="text-sm theme-text-secondary text-center">
              Already have an account?{' '}
              <Link href="/login" className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                Login here
              </Link>
            </p>
          </div>

          <div className="mt-4">
            <Link href="/" className="text-sm theme-text-secondary hover:theme-text-primary">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

