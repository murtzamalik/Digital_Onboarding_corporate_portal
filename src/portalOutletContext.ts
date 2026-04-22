import { useOutletContext } from 'react-router-dom'
import { type PortalSession } from './api/types'

export type PortalOutletContextValue = {
  session: PortalSession | null
  sessionReady: boolean
}

export function usePortalOutletContext(): PortalOutletContextValue {
  const ctx = useOutletContext<PortalOutletContextValue | undefined>()
  return ctx ?? { session: null, sessionReady: false }
}
