/**
 * Get the API URL dynamically based on the current environment.
 * Uses relative paths when possible, or constructs from the current host.
 */
export function getApiUrl(): string {
  // If we're in the browser, use relative paths or construct from current host
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    const currentHostname = window.location.hostname;
    const currentPort = window.location.port;
    const currentProtocol = window.location.protocol;
    
    // If NEXT_PUBLIC_API_URL is set, check if it contains localhost
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envApiUrl) {
      // If it's a full URL but contains localhost, replace with current hostname
      // This allows external devices to work even if env var is set to localhost
      if (envApiUrl.startsWith('http://') || envApiUrl.startsWith('https://')) {
        // Replace localhost/127.0.0.1 with current hostname for external access
        if (envApiUrl.includes('localhost') || envApiUrl.includes('127.0.0.1')) {
          // Extract port from env URL or use default 3001
          const urlMatch = envApiUrl.match(/:\d+/);
          const apiPort = urlMatch ? urlMatch[0].substring(1) : '3001';
          return `${currentProtocol}//${currentHostname}:${apiPort}`;
        }
        return envApiUrl;
      }
      // If it's a relative path, construct from current origin
      return `${currentOrigin}${envApiUrl.startsWith('/') ? '' : '/'}${envApiUrl}`;
    }
    
    // Default behavior: construct API URL from current host
    // In development: web on 3000, API on 3001
    // In production: assume API is on same origin (use relative paths)
    
    // If no port specified (production), use relative paths
    if (currentPort === '') {
      return ''; // Use relative paths (same origin)
    }
    
    // Development: construct API URL with same hostname but port 3001
    // This works when accessing from any device on the same network
    return `${currentProtocol}//${currentHostname}:3001`;
  }
  
  // Server-side: use env var or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

