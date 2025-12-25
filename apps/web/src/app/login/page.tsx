'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../../lib/api-utils';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = getApiUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Store tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Load user theme preference if available
        if (data.user?.theme) {
          setTheme(data.user.theme);
        }
        
        // Redirect to ingestion page or home
        router.push('/ingestion');
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Login failed' }));
        setError(errorData.message || 'Invalid email or password');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const apiDisplay = apiUrl || window.location.origin;
      setError(`Network error: ${errorMessage}. Please check if the API server is running on ${apiDisplay}`);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="theme-bg-card rounded-lg theme-shadow p-8 border theme-border">
          <h1 className="text-3xl font-bold mb-2 theme-text-primary">Login</h1>
          <p className="theme-text-secondary mb-6">
            Sign in to access data ingestion and other features
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium theme-text-secondary mb-1">
                Email
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
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded border theme-border theme-bg-secondary theme-text-primary focus:outline-none focus:ring-2 focus:ring-opacity-50"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: loading ? 'var(--bg-hover)' : 'var(--accent-primary)', 
                color: 'white'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t theme-border">
            <p className="text-sm theme-text-secondary text-center">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                Register here
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

