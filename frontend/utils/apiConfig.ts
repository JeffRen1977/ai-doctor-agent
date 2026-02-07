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
  // In development, try direct backend URL first, fallback to proxy
  if (import.meta.env.DEV) {
    // Try direct backend URL (more reliable than proxy)
    const directBackendUrl = 'http://localhost:8000/api'
    console.log('🔧 Using direct backend URL:', directBackendUrl)
    return directBackendUrl
  }
  // Default to relative path (works for local dev and same-domain deployments)
  return '/api'
}
