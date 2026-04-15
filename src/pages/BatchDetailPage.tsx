import { type FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiClient } from '../api/client'

type BatchDetail = {
  id: number
  batchReference: string
  originalFilename: string
  status: string
  totalRows: number
  validRowCount: number
  invalidRowCount: number
  createdAt: string
  updatedAt: string
}

export function BatchDetailPage() {
  const { ref } = useParams<{ ref: string }>()
  const [detail, setDetail] = useState<BatchDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!ref) return
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const { data } = await apiClient.get<BatchDetail>(
          `/batches/${encodeURIComponent(ref)}`,
        )
        if (!cancelled) setDetail(data)
      } catch {
        if (!cancelled) {
          setError('Batch not found or not accessible.')
          setDetail(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ref])

  async function onCorrectionSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!ref) return
    const form = e.currentTarget
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setUploadMsg('Choose a correction file first.')
      return
    }
    setUploadMsg(null)
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', file)
      await apiClient.post(`/batches/${encodeURIComponent(ref)}/corrections/upload`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadMsg('Correction upload accepted.')
      fileInput.value = ''
    } catch {
      setUploadMsg('Correction upload failed (ADMIN only, valid Excel).')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page">
      <h1 className="page__title">Batch</h1>
      <p className="page__lead">
        <Link to="/batches">← All batches</Link>
      </p>
      {loading ? <p className="page__stub">Loading…</p> : null}
      {error ? <p className="page__error">{error}</p> : null}
      {detail && !loading ? (
        <>
          <dl className="detail-dl">
            <div>
              <dt>Reference</dt>
              <dd>
                <code>{detail.batchReference}</code>
              </dd>
            </div>
            <div>
              <dt>Original file</dt>
              <dd>{detail.originalFilename}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{detail.status}</dd>
            </div>
            <div>
              <dt>Rows</dt>
              <dd>
                {detail.totalRows} total · {detail.validRowCount} valid · {detail.invalidRowCount}{' '}
                invalid
              </dd>
            </div>
          </dl>
          <h2 className="page__title" style={{ fontSize: '1.1rem', marginTop: '1.25rem' }}>
            Correction upload
          </h2>
          <p className="page__notice">ADMIN role only. Expects correction Excel per CEBOS rules.</p>
          <form className="page__form" onSubmit={onCorrectionSubmit}>
            <label className="page__label">
              File
              <input className="page__input" name="file" type="file" accept=".xlsx,.xls" required />
            </label>
            {uploadMsg ? <p className="page__notice">{uploadMsg}</p> : null}
            <button className="page__button" type="submit" disabled={busy}>
              {busy ? 'Uploading…' : 'Upload corrections'}
            </button>
          </form>
        </>
      ) : null}
    </section>
  )
}
