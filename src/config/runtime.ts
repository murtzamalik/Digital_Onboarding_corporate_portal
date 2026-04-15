/** Relative URL uses Vite dev proxy; override with VITE_API_BASE_URL for direct backend. */
const DEFAULT_API_BASE_URL = '/api/v1/portal'

export const runtimeConfig = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
    DEFAULT_API_BASE_URL,
}
