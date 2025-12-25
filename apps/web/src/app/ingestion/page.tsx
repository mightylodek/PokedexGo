'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormattedDate } from '../../components/FormattedDate';
import { getApiUrl } from '../../lib/api-utils';

interface IngestionRun {
  id: string;
  status: string;
  summary: string | null;
  errors: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface IngestionState {
  id: string;
  lastTimestamp: string | null;
  lastSuccess: string | null;
}

export default function IngestionPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [state, setState] = useState<IngestionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [checkResult, setCheckResult] = useState<{ hasUpdate: boolean; timestamp?: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRun, setCurrentRun] = useState<{
    id: string;
    status: string;
    startedAt: string;
    elapsedSeconds: number;
    summary: string | null;
  } | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const apiUrl = getApiUrl();

  // Check authentication status and redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const authenticated = !!token;
    setIsAuthenticated(authenticated);
    
    if (!authenticated) {
      // Redirect to login after a short delay to show the auth message
      const timer = setTimeout(() => {
        router.push('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [runsRes, stateRes] = await Promise.all([
        fetch(`${apiUrl}/ingestion/history`, { headers }),
        fetch(`${apiUrl}/ingestion/state`, { headers }),
      ]);

      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(runsData);
      } else if (runsRes.status === 401) {
        console.warn('Authentication required for ingestion history');
      }

      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setState(stateData);
      } else if (stateRes.status === 401) {
        console.warn('Authentication required for ingestion state');
        setIsAuthenticated(false);
      }

      // Update auth status based on responses
      if (runsRes.status === 401 || stateRes.status === 401) {
        setIsAuthenticated(false);
      } else if (runsRes.ok || stateRes.ok) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUpdates = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/ingestion/check-updates`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCheckResult(data);
      }
    } catch (error) {
      console.error('Error checking updates:', error);
    }
  };

  const checkCurrentRun = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/ingestion/current-run`, { headers });
      if (res.ok) {
        let data: any = null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
          setCurrentRun(data);
          setRunning(!!data);
        } else {
          // Handle non-JSON response
          const text = await res.text();
          if (text && text.trim() !== 'null' && text.trim() !== '') {
            try {
              data = JSON.parse(text);
              setCurrentRun(data);
              setRunning(!!data);
            } catch (e) {
              setCurrentRun(null);
              setRunning(false);
            }
          } else {
            setCurrentRun(null);
            setRunning(false);
          }
        }
        
        // Calculate estimated time based on previous successful runs
        if (data && runs.length > 0) {
          const successfulRuns = runs.filter(r => r.status === 'SUCCESS' && r.completedAt);
          if (successfulRuns.length > 0) {
            const avgDuration = successfulRuns.reduce((sum, run) => {
              const duration = new Date(run.completedAt!).getTime() - new Date(run.startedAt).getTime();
              return sum + duration;
            }, 0) / successfulRuns.length;
            setEstimatedTime(Math.floor(avgDuration / 1000));
          }
        } else {
          setEstimatedTime(null);
        }
      } else {
        setCurrentRun(null);
        setRunning(false);
      }
    } catch (error) {
      console.error('Error checking current run:', error);
    }
  };

  const runIngestion = async (itemsOnly: boolean = false) => {
    setRunning(true);
    setCurrentRun(null);
    setEstimatedTime(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('Authentication required. Please login first.\n\nYou can get a token by:\n1. Registering: POST /auth/register\n2. Logging in: POST /auth/login\n3. Adding the accessToken to localStorage as "accessToken"');
        setRunning(false);
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Start ingestion (non-blocking)
      const endpoint = itemsOnly ? '/ingestion/run-items' : '/ingestion/run';
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        const result = await res.json();
        
        // Start polling for status
        const pollInterval = setInterval(async () => {
          await checkCurrentRun();
          await fetchData();
          
          // Stop polling if ingestion is complete
          try {
            const historyRes = await fetch(`${apiUrl}/ingestion/history`, { headers });
            if (historyRes.ok) {
              const runs = await historyRes.json();
              const latestRun = runs[0];
              if (latestRun && latestRun.status !== 'RUNNING') {
                clearInterval(pollInterval);
                setRunning(false);
                setCurrentRun(null);
                
                // Build completion message with errors if any
                let completionMessage = `Ingestion completed: ${latestRun.summary || result.summary || 'Success'}`;
                if (latestRun.errors) {
                  try {
                    const errors = JSON.parse(latestRun.errors);
                    const errorArray = Array.isArray(errors) ? errors : [errors];
                    if (errorArray.length > 0) {
                      completionMessage += `\n\nErrors (${errorArray.length}):\n${errorArray.slice(0, 5).join('\n')}`;
                      if (errorArray.length > 5) {
                        completionMessage += `\n... and ${errorArray.length - 5} more (see details in history table)`;
                      }
                    }
                  } catch (e) {
                    // If parsing fails, just append the raw error string
                    completionMessage += `\n\nErrors: ${latestRun.errors}`;
                  }
                }
                
                alert(completionMessage);
                await fetchData();
                
                // Auto-expand errors for the latest run if it has errors
                if (latestRun.errors) {
                  setExpandedErrors(new Set([latestRun.id]));
                }
              }
            }
          } catch (err) {
            console.error('Error checking ingestion status:', err);
          }
        }, 2000); // Poll every 2 seconds

        // Also check immediately
        setTimeout(checkCurrentRun, 1000);
      } else {
        let errorMessage = 'Failed to run ingestion';
        try {
          const error = await res.json();
          errorMessage = error.message || error.error || errorMessage;
          
          if (res.status === 401) {
            errorMessage = 'Authentication failed. Your token may have expired. Please login again and update the accessToken in localStorage.';
          } else if (res.status === 403) {
            errorMessage = 'Access forbidden. You may not have permission to run ingestion.';
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        alert(`Error (${res.status}): ${errorMessage}`);
        setRunning(false);
      }
    } catch (error) {
      console.error('Error running ingestion:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Failed to connect to API'}`);
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchData();
    checkCurrentRun();
  }, []);

  // Poll for current run status
  useEffect(() => {
    if (!running) return;
    
    const pollInterval = setInterval(() => {
      checkCurrentRun();
      fetchData();
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [running]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p className="theme-text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 theme-text-primary">Data Ingestion</h1>

        {/* Authentication Status */}
        {!isAuthenticated && (
          <div className="theme-bg-card rounded-lg theme-shadow p-6 mb-6 border theme-border" style={{ borderColor: 'var(--accent-primary)' }}>
            <h2 className="text-xl font-semibold mb-2 theme-text-primary">⚠️ Authentication Required</h2>
            <p className="theme-text-secondary mb-4">
              You need to login to access this page. Redirecting to login...
            </p>
            <div className="flex gap-4">
              <a 
                href="/login" 
                className="px-4 py-2 rounded font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--accent-primary)', 
                  color: 'white'
                }}
              >
                Go to Login
              </a>
              <a 
                href="/register" 
                className="px-4 py-2 rounded font-medium transition-colors border theme-border"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: 'var(--accent-primary)'
                }}
              >
                Register
              </a>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="theme-bg-card rounded-lg theme-shadow p-6 mb-6 border theme-border">
          <h2 className="text-2xl font-semibold mb-4 theme-text-primary">Current Status</h2>
          {state && (
            <div className="space-y-2">
              <p className="theme-text-secondary">
                <span className="font-medium">Last Success:</span>{' '}
                <FormattedDate date={state.lastSuccess} fallback="Never" />
              </p>
              <p className="theme-text-secondary">
                <span className="font-medium">Last Timestamp:</span>{' '}
                {state.lastTimestamp || 'N/A'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="theme-bg-card rounded-lg theme-shadow p-6 mb-6 border theme-border">
          <h2 className="text-2xl font-semibold mb-4 theme-text-primary">Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={checkUpdates}
              disabled={running}
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'var(--accent-primary)', 
                color: 'white'
              }}
            >
              Check for Updates
            </button>
            <button
              onClick={() => runIngestion(false)}
              disabled={running}
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: running ? 'var(--bg-hover)' : 'var(--accent-secondary)', 
                color: 'white'
              }}
            >
              {running ? 'Running...' : 'Run Full Ingestion'}
            </button>
            <button
              onClick={() => runIngestion(true)}
              disabled={running}
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: running ? 'var(--bg-hover)' : 'var(--accent-primary)', 
                color: 'white'
              }}
            >
              {running ? 'Running...' : 'Run Items Only'}
            </button>
          </div>

          {/* Progress Indicator */}
          {running && currentRun && (
            <div className="mt-6 p-4 theme-bg-secondary rounded border theme-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold theme-text-primary">Ingestion in Progress</h3>
                <span className="text-sm theme-text-secondary">
                  {Math.floor(currentRun.elapsedSeconds / 60)}m {currentRun.elapsedSeconds % 60}s
                  {estimatedTime && ` / ~${Math.floor(estimatedTime / 60)}m ${estimatedTime % 60}s`}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: estimatedTime
                      ? `${Math.min(100, (currentRun.elapsedSeconds / estimatedTime) * 100)}%`
                      : '0%',
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="theme-text-secondary">
                  {estimatedTime
                    ? `Estimated ${Math.max(0, Math.floor((estimatedTime - currentRun.elapsedSeconds) / 60))}m ${Math.max(0, (estimatedTime - currentRun.elapsedSeconds) % 60)}s remaining`
                    : 'Processing...'}
                </span>
                <span className="theme-text-secondary">
                  Started: <FormattedDate date={currentRun.startedAt} />
                </span>
              </div>
              
              {currentRun.summary && (
                <div className="mt-2 text-sm theme-text-secondary">
                  {currentRun.summary}
                </div>
              )}
            </div>
          )}
          {checkResult && (
            <div className="mt-4 p-4 theme-bg-secondary rounded border theme-border">
              <p className="theme-text-secondary">
                <span className="font-medium">Update Available:</span>{' '}
                {checkResult.hasUpdate ? 'Yes' : 'No'}
              </p>
              {checkResult.timestamp && (
                <p className="theme-text-secondary">
                  <span className="font-medium">Timestamp:</span> {checkResult.timestamp}
                </p>
              )}
            </div>
          )}
        </div>

        {/* History */}
        <div className="theme-bg-card rounded-lg theme-shadow p-6 border theme-border">
          <h2 className="text-2xl font-semibold mb-4 theme-text-primary">Ingestion History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
              <thead className="theme-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="theme-bg-card divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {runs.map((run) => (
                  <tr key={run.id} className="hover:theme-bg-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          run.status === 'SUCCESS'
                            ? 'bg-green-500 text-white'
                            : run.status === 'FAILED'
                            ? 'bg-red-500 text-white'
                            : run.status === 'RUNNING'
                            ? 'bg-blue-500 text-white'
                            : 'theme-bg-secondary theme-text-secondary'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm theme-text-primary">{run.summary || '-'}</div>
                      {run.errors && (() => {
                        try {
                          const errors = JSON.parse(run.errors);
                          const errorArray = Array.isArray(errors) ? errors : [errors];
                          const isExpanded = expandedErrors.has(run.id);
                          
                          return (
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedErrors);
                                  if (isExpanded) {
                                    newExpanded.delete(run.id);
                                  } else {
                                    newExpanded.add(run.id);
                                  }
                                  setExpandedErrors(newExpanded);
                                }}
                                className="text-xs font-medium transition-colors hover:opacity-80"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                {isExpanded ? '▼' : '▶'} {errorArray.length} error(s)
                              </button>
                              {isExpanded && (
                                <div className="mt-2 p-3 rounded border theme-border theme-bg-secondary max-h-64 overflow-y-auto">
                                  <ul className="space-y-1 text-xs theme-text-secondary">
                                    {errorArray.map((error: string, idx: number) => (
                                      <li key={idx} className="font-mono break-words">
                                        {error}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="text-xs mt-1" style={{ color: 'var(--accent-primary)' }}>
                              Errors: {run.errors}
                            </div>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      <FormattedDate date={run.startedAt} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      <FormattedDate date={run.completedAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {runs.length === 0 && (
              <p className="text-center theme-text-muted py-8">No ingestion runs yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

