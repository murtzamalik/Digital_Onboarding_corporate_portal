import { useState } from 'react'
import { getPortalAccessToken } from '../auth/token'
import { runtimeConfig } from '../config/runtime'

function currentYearMonth(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

async function downloadReport(path: string, filename: string) {
  const token = getPortalAccessToken()
  const url = `${runtimeConfig.apiBaseUrl}${path}`
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

export function ReportsPage() {
  const [month, setMonth] = useState(currentYearMonth())
  const [batchRef, setBatchRef] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function runDownload(label: string, path: string, filename: string) {
    setMessage(null)
    setBusy(true)
    try {
      await downloadReport(path, filename)
      setMessage(`${label} download started.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Download failed. Sign in and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page">
      <h1 className="page__title">Reports</h1>
      <p className="page__lead">Download CSV exports from the CEBOS API (portal role required).</p>

      <div className="page__stack">
        <label className="page__label">
          Month (YYYY-MM)
          <input
            className="page__input"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            pattern="\d{4}-\d{2}"
            placeholder="2026-04"
          />
        </label>
        <button
          className="page__button"
          type="button"
          disabled={busy || !/^\d{4}-\d{2}$/.test(month)}
          onClick={() =>
            runDownload('Monthly', `/reports/monthly?month=${encodeURIComponent(month)}`, `monthly-${month}.csv`)
          }
        >
          Download monthly CSV
        </button>
      </div>

      <div className="page__stack">
        <label className="page__label">
          Batch reference
          <input
            className="page__input"
            value={batchRef}
            onChange={(e) => setBatchRef(e.target.value)}
            placeholder="BATCH-ABC123"
          />
        </label>
        <button
          className="page__button"
          type="button"
          disabled={busy || !batchRef.trim()}
          onClick={() =>
            runDownload(
              'Batch',
              `/reports/batch/${encodeURIComponent(batchRef.trim())}`,
              `batch-${batchRef.trim()}.csv`,
            )
          }
        >
          Download batch CSV
        </button>
      </div>

      <div className="page__stack">
        <button
          className="page__button"
          type="button"
          disabled={busy}
          onClick={() => runDownload('Blocked employees', '/reports/blocked', 'blocked-employees.csv')}
        >
          Download blocked employees CSV
        </button>
      </div>

      {message ? <p className="page__notice">{message}</p> : null}
    </section>
  )
}
