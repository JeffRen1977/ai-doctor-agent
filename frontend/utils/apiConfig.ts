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
  // Default to relative path (works for local dev and same-domain deployments)
  return '/api'
}
