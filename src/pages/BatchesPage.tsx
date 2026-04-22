import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link as MuiLink,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { usePortalOutletContext } from '../portalOutletContext'
import { apiClient } from '../api/client'
import { type SpringPage } from '../api/types'

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
  const { session, sessionReady } = usePortalOutletContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [data, setData] = useState<SpringPage<BatchRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [listRefresh, setListRefresh] = useState(0)

  useEffect(() => {
    if (!sessionReady) return
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
  }, [page, listRefresh, sessionReady])

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (session?.corporateClientId == null) {
      setUploadMsg('No corporate client on your account.')
      return
    }
    const file = fileInputRef.current?.files?.[0]
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
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFileLabel(null)
      setPage(0)
      setListRefresh((n) => n + 1)
    } catch {
      setUploadMsg('Upload failed (ADMIN only, valid Excel).')
    } finally {
      setUploadBusy(false)
    }
  }

  if (!sessionReady) {
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
          Batches
        </Typography>
        <Stack spacing={1} sx={{ py: 2, flexDirection: 'row', alignItems: 'center' }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        </Stack>
      </Box>
    )
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
        Batches
      </Typography>

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          Loading…
        </Typography>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {session?.corporateClientId != null ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            New batch upload
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            ADMIN role only.
          </Typography>
          <Box component="form" onSubmit={onUpload}>
            <Stack spacing={2} sx={{ maxWidth: 480 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={(ev) => setFileLabel(ev.target.files?.[0]?.name ?? null)}
              />
              <Stack spacing={2} sx={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button type="button" variant="outlined" onClick={() => fileInputRef.current?.click()}>
                  Choose Excel
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {fileLabel ?? 'No file chosen'}
                </Typography>
              </Stack>
              {uploadMsg ? (
                <Alert severity={uploadMsg.includes('failed') ? 'error' : 'info'}>{uploadMsg}</Alert>
              ) : null}
              <Button type="submit" disabled={uploadBusy}>
                {uploadBusy ? 'Uploading…' : 'Upload'}
              </Button>
            </Stack>
          </Box>
        </Box>
      ) : null}

      {data && !loading ? (
        <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Page {data.number + 1} of {Math.max(1, data.totalPages)} · {data.totalElements} total
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Rows</TableCell>
                  <TableCell>Valid / invalid</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.content.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell>
                      <MuiLink component={RouterLink} to={`/batches/${encodeURIComponent(b.batchReference)}`} underline="hover">
                        {b.batchReference}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{b.status}</TableCell>
                    <TableCell>{b.totalRows}</TableCell>
                    <TableCell>
                      {b.validRowCount} / {b.invalidRowCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack spacing={1} sx={{ flexDirection: 'row' }}>
            <Button variant="outlined" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Previous
            </Button>
            <Button variant="outlined" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </Stack>
        </>
      ) : null}
    </Box>
  )
}
