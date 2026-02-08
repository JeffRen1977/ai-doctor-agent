/**
 * Get API base URL based on environment
 * In production (Vercel), use the Railway backend URL from environment variable
 * In development, use relative path which will be proxied by Vite
 */
export const getApiBaseUrl = (): string => {
  // Check for explicit API base URL first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  // Check for Railway backend URL
  if (import.meta.env.VITE_RAILWAY_BACKEND_URL) {
    return `${import.meta.env.VITE_RAILWAY_BACKEND_URL}/api`
  }
  // In development, detect if accessing from mobile device
  if (import.meta.env.DEV) {
    // Check if we're accessing from a mobile device or different host
    const hostname = window.location.hostname
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    
    if (isLocalhost) {
      // Desktop browser: use localhost
      const directBackendUrl = 'http://localhost:8000/api'
      console.log('🔧 Using direct backend URL (desktop):', directBackendUrl)
      return directBackendUrl
    } else {
      // Mobile device or remote access: use the same hostname with port 8000
      const mobileBackendUrl = `http://${hostname}:8000/api`
      console.log('🔧 Using backend URL (mobile/remote):', mobileBackendUrl)
      return mobileBackendUrl
    }
  }
  // Default to relative path (works for local dev and same-domain deployments)
  return '/api'
}
