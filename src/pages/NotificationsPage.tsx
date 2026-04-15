import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { type SpringPage } from '../api/types'

type NotificationRow = {
  id: number
  templateKey: string
  status: string
  recipientEmail: string
  createdAt: string
  sentAt: string | null
  errorMessage: string | null
}

const PAGE_SIZE = 25

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function NotificationsPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<SpringPage<NotificationRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const { data: body } = await apiClient.get<SpringPage<NotificationRow>>('/notifications', {
          params: { page, size: PAGE_SIZE, sort: 'createdAt,desc' },
        })
        if (!cancelled) setData(body)
      } catch {
        if (!cancelled) {
          setError('Could not load notifications.')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <section className="page">
      <h1 className="page__title">Notifications</h1>
      <p className="page__lead">
        Email delivery log for addresses belonging to users in your organization (e.g. password
        reset). Payload details stay on the server.
      </p>
      {loading ? <p className="page__stub">Loading…</p> : null}
      {error ? <p className="page__error">{error}</p> : null}
      {data && !loading && data.totalElements === 0 ? (
        <p className="page__stub">No notification rows yet for your team&apos;s addresses.</p>
      ) : null}
      {data && !loading && data.totalElements > 0 ? (
        <>
          <p className="page__lead">
            Page {data.number + 1} of {Math.max(1, data.totalPages)} · {data.totalElements} total
          </p>
          <div className="table-wrap">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>To</th>
                  <th>Sent</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((n) => (
                  <tr key={n.id}>
                    <td>{formatWhen(n.createdAt)}</td>
                    <td>
                      <code>{n.templateKey}</code>
                    </td>
                    <td>{n.status}</td>
                    <td>{n.recipientEmail}</td>
                    <td>{formatWhen(n.sentAt)}</td>
                    <td>{n.errorMessage ? <span title={n.errorMessage}>Yes</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button
              type="button"
              className="page__button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="page__button"
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
