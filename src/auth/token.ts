const ACCESS_KEY = 'cebos_portal_access_token'
const REFRESH_KEY = 'cebos_portal_refresh_token'

export function getPortalAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY)
}

export function clearPortalAccessToken(): void {
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}

export function getPortalRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY)
}

export function setPortalTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(ACCESS_KEY, accessToken)
  sessionStorage.setItem(REFRESH_KEY, refreshToken)
}
