import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import { type PortalSession, type SpringPage } from '../api/types'

type BatchRow = {
  id: number
  batchReference: string
  status: string
  totalRows: number
  validRowCount: number
  invalidRowCount: number
  createdAt: string
}

export function DashboardPage() {
  const [session, setSession] = useState<PortalSession | null>(null)
  const [batches, setBatches] = useState<SpringPage<BatchRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const [sRes, bRes] = await Promise.all([
          apiClient.get<PortalSession>('/session'),
          apiClient.get<SpringPage<BatchRow>>('/batches', {
            params: { page: 0, size: 5, sort: 'createdAt,desc' },
          }),
        ])
        if (!cancelled) {
          setSession(sRes.data)
          setBatches(bRes.data)
        }
      } catch {
        if (!cancelled) {
          setError('Could not load dashboard. Sign in again or check the API.')
          setSession(null)
          setBatches(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="page">
      <h1 className="page__title">Dashboard</h1>
      {loading ? <p className="page__stub">Loading…</p> : null}
      {error ? <p className="page__error">{error}</p> : null}
      {session && !loading ? (
        <p className="page__lead">
          Signed in as portal user <code>{session.portalUserId}</code>
          {session.corporateClientId != null ? (
            <>
              {' '}
              · Client <code>{session.corporateClientId}</code>
            </>
          ) : null}
        </p>
      ) : null}
      {batches && !loading ? (
        <>
          <p className="page__lead">
            <strong>{batches.totalElements}</strong> batch{batches.totalElements === 1 ? '' : 'es'}{' '}
            total.
          </p>
          {batches.content.length > 0 ? (
            <ul className="page__stack">
              {batches.content.map((b) => (
                <li key={b.id}>
                  <Link to={`/batches/${encodeURIComponent(b.batchReference)}`}>
                    {b.batchReference}
                  </Link>{' '}
                  <span className="page__stub">
                    ({b.status} · {b.validRowCount}/{b.totalRows} valid)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="page__stub">No batches yet. Upload one from the Batches page.</p>
          )}
          <p>
            <Link to="/batches">View all batches</Link>
          </p>
        </>
      ) : null}
      <p className="page__notice">
        Status-driven data comes from <code>/api/v1/portal/session</code> and{' '}
        <code>/api/v1/portal/batches</code>.
      </p>
    </section>
  )
}
