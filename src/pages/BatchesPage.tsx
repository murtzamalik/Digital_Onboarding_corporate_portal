import { type FormEvent, useEffect, useState } from 'react'
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

const PAGE_SIZE = 20

export function BatchesPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<SpringPage<BatchRow> | null>(null)
  const [session, setSession] = useState<PortalSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [listRefresh, setListRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: s } = await apiClient.get<PortalSession>('/session')
        if (!cancelled) setSession(s)
      } catch {
        if (!cancelled) setSession(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const { data: body } = await apiClient.get<SpringPage<BatchRow>>('/batches', {
          params: {
            page,
            size: PAGE_SIZE,
            sort: 'createdAt,desc',
          },
        })
        if (!cancelled) setData(body)
      } catch {
        if (!cancelled) {
          setError('Could not load batches.')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, listRefresh])

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (session?.corporateClientId == null) {
      setUploadMsg('No corporate client on your account.')
      return
    }
    const form = e.currentTarget
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setUploadMsg('Choose an Excel file.')
      return
    }
    setUploadMsg(null)
    setUploadBusy(true)
    try {
      const body = new FormData()
      body.append('corporateClientId', String(session.corporateClientId))
      body.append('file', file)
      await apiClient.post('/batches/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadMsg('Upload started. Refresh the list in a moment.')
      fileInput.value = ''
      setPage(0)
      setListRefresh((n) => n + 1)
    } catch {
      setUploadMsg('Upload failed (ADMIN only, valid Excel).')
    } finally {
      setUploadBusy(false)
    }
  }

  return (
    <section className="page">
      <h1 className="page__title">Batches</h1>
      {loading ? <p className="page__stub">Loading…</p> : null}
      {error ? <p className="page__error">{error}</p> : null}
      {session?.corporateClientId != null ? (
        <>
          <h2 className="page__title" style={{ fontSize: '1.1rem' }}>
            New batch upload
          </h2>
          <p className="page__notice">ADMIN role only.</p>
          <form className="page__form" onSubmit={onUpload}>
            <label className="page__label">
              Excel file
              <input className="page__input" name="file" type="file" accept=".xlsx,.xls" required />
            </label>
            {uploadMsg ? <p className="page__notice">{uploadMsg}</p> : null}
            <button className="page__button" type="submit" disabled={uploadBusy}>
              {uploadBusy ? 'Uploading…' : 'Upload'}
            </button>
          </form>
        </>
      ) : null}
      {data && !loading ? (
        <>
          <p className="page__lead">
            Page {data.number + 1} of {Math.max(1, data.totalPages)} · {data.totalElements} total </p>
          <div className="table-wrap">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Rows</th>
                  <th>Valid / invalid</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link to={`/batches/${encodeURIComponent(b.batchReference)}`}>
                        {b.batchReference}
                      </Link>
                    </td>
                    <td>{b.status}</td>
                    <td>{b.totalRows}</td>
                    <td>
                      {b.validRowCount} / {b.invalidRowCount}
                    </td>
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
