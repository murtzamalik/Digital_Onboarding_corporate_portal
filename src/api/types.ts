export type PortalSession = {
  portalUserId: number
  corporateClientId: number | null
  authorities: string[]
}

export type SpringPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export function sessionIsAdmin(session: PortalSession | null): boolean {
  return session?.authorities?.includes('ROLE_ADMIN') ?? false
}
