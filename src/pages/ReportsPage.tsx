import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { apiClient } from '../api/client'

function currentYearMonth(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

async function downloadBlob(path: string, filename: string) {
  const { data } = await apiClient.get<Blob>(path, { responseType: 'blob' })
  const href = URL.createObjectURL(data)
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
      await downloadBlob(path, filename)
      setMessage(`${label} download started.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Download failed. Sign in and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      component="section"
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 3,
      }}
    >
      <Typography variant="h6" component="h1" gutterBottom>
        Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Download CSV exports from the CEBOS API (portal role required).
      </Typography>

      <Stack spacing={3} sx={{ maxWidth: 360 }}>
        <Stack spacing={1.5}>
          <TextField
            label="Month (YYYY-MM)"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="2026-04"
            slotProps={{ htmlInput: { pattern: '\\d{4}-\\d{2}' } }}
            fullWidth
          />
          <Button
            variant="contained"
            disabled={busy || !/^\d{4}-\d{2}$/.test(month)}
            onClick={() =>
              runDownload('Monthly', `/reports/monthly?month=${encodeURIComponent(month)}`, `monthly-${month}.csv`)
            }
          >
            Download monthly CSV
          </Button>
        </Stack>

        <Stack spacing={1.5}>
          <TextField
            label="Batch reference"
            value={batchRef}
            onChange={(e) => setBatchRef(e.target.value)}
            placeholder="BATCH-ABC123"
            fullWidth
          />
          <Button
            variant="contained"
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
          </Button>
        </Stack>

        <Box>
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() => runDownload('Blocked employees', '/reports/blocked', 'blocked-employees.csv')}
          >
            Download blocked employees CSV
          </Button>
        </Box>
      </Stack>

      {message ? (
        <Alert severity={message.includes('failed') ? 'error' : 'success'} sx={{ mt: 2 }}>
          {message}
        </Alert>
      ) : null}
    </Box>
  )
}
