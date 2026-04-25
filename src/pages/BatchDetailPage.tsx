import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Divider,
  Link as MuiLink,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  Paper,
} from '@mui/material'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiClient } from '../api/client'
import { fetchBatchEmployees, type PortalBatchEmployeeRow } from '../api/batchEmployees'
import { sessionIsAdmin, type SpringPage } from '../api/types'
import { OnboardingStatusChip } from '../components/StatusChip'
import { usePortalOutletContext } from '../portalOutletContext'

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

type InviteDispatchResponse = {
  attempted: number
  transitioned: number
  smsEnqueued: number
  transitionErrors: number
}

const EMP_PAGE_SIZE = 15

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {children}
      </Typography>
    </Stack>
  )
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

export function BatchDetailPage() {
  const { ref } = useParams<{ ref: string }>()
  const { session, sessionReady } = usePortalOutletContext()
  const correctionFileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState(0)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [detail, setDetail] = useState<BatchDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [empPage, setEmpPage] = useState(0)
  const [empData, setEmpData] = useState<SpringPage<PortalBatchEmployeeRow> | null>(null)
  const [empLoading, setEmpLoading] = useState(false)
  const [empError, setEmpError] = useState<string | null>(null)
  const [exportBusy, setExportBusy] = useState(false)

  const isAdmin = sessionReady && sessionIsAdmin(session)

  useEffect(() => {
    if (!ref) return
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const { data } = await apiClient.get<BatchDetail>(`/batches/${encodeURIComponent(ref)}`)
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

  useEffect(() => {
    if (!ref || tab !== 1) return
    let cancelled = false
    ;(async () => {
      setEmpError(null)
      setEmpLoading(true)
      try {
        const data = await fetchBatchEmployees(ref, empPage, EMP_PAGE_SIZE)
        if (!cancelled) setEmpData(data)
      } catch {
        if (!cancelled) {
          setEmpError('Could not load employees for this batch.')
          setEmpData(null)
        }
      } finally {
        if (!cancelled) setEmpLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ref, tab, empPage])

  async function onDispatchInvites() {
    if (!ref) return
    setInviteMsg(null)
    setInviteBusy(true)
    try {
      const { data } = await apiClient.post<InviteDispatchResponse>(
        `/batches/${encodeURIComponent(ref)}/invites/dispatch`,
      )
      setInviteMsg(
        `Processed ${data.attempted}: ${data.transitioned} moved to INVITED, ${data.smsEnqueued} SMS queued, ${data.transitionErrors} errors.`,
      )
    } catch {
      setInviteMsg('Invite dispatch failed (ADMIN only, or no VALIDATED rows in this batch).')
    } finally {
      setInviteBusy(false)
    }
  }

  async function onCorrectionSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!ref) return
    const file = correctionFileRef.current?.files?.[0]
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
      if (correctionFileRef.current) correctionFileRef.current.value = ''
      setFileLabel(null)
    } catch {
      setUploadMsg('Correction upload failed (ADMIN only, valid Excel).')
    } finally {
      setBusy(false)
    }
  }

  async function onExportBatchCsv() {
    if (!ref) return
    setExportBusy(true)
    try {
      await downloadBlob(
        `/reports/batch/${encodeURIComponent(ref)}`,
        `batch-report-${ref}.csv`,
      )
    } catch {
      setUploadMsg('Export failed. Try again when signed in.')
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Breadcrumbs sx={{ typography: 'body2' }}>
        <MuiLink component={Link} to="/batches" underline="hover" color="inherit">
          Batches
        </MuiLink>
        <Typography color="text.primary">{ref ?? '—'}</Typography>
      </Breadcrumbs>

      <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, pt: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Batch workspace
          </Typography>
          {detail ? (
            <Typography variant="body2" color="text.secondary" sx={{ pb: 1.5 }}>
              {detail.originalFilename} · {detail.totalRows} rows
            </Typography>
          ) : null}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 0.5 }}>
            <Tab label="Overview & actions" />
            <Tab label="Employees in batch" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {loading ? (
            <Typography color="text.secondary">Loading…</Typography>
          ) : null}
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {detail && !loading && tab === 0 ? (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <DetailRow label="Reference">
                  <Typography component="code" variant="body2">
                    {detail.batchReference}
                  </Typography>
                </DetailRow>
                <DetailRow label="Status">{detail.status}</DetailRow>
                <DetailRow label="Rows">
                  {detail.totalRows} total · {detail.validRowCount} valid · {detail.invalidRowCount} invalid
                </DetailRow>
                <DetailRow label="Updated">{detail.updatedAt}</DetailRow>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button variant="outlined" disabled={exportBusy} onClick={() => void onExportBatchCsv()}>
                  {exportBusy ? 'Exporting…' : 'Download batch CSV'}
                </Button>
              </Stack>

              {isAdmin ? (
                <>
                  <Divider />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Send invites (bulk)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 720 }}>
                    ADMIN only. Moves VALIDATED employees in this batch to INVITED and queues invite SMS when a
                    mobile number is present.
                  </Typography>
                  {inviteMsg ? (
                    <Alert severity={inviteMsg.includes('failed') ? 'error' : 'success'}>{inviteMsg}</Alert>
                  ) : null}
                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={inviteBusy}
                    onClick={() => void onDispatchInvites()}
                  >
                    {inviteBusy ? 'Dispatching…' : 'Dispatch invites for this batch'}
                  </Button>
                </>
              ) : null}

              <Divider />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Correction upload
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                ADMIN role only. Expects correction Excel per CEBOS rules.
              </Typography>
              <Box component="form" onSubmit={onCorrectionSubmit}>
                <Stack spacing={2} sx={{ maxWidth: 480 }}>
                  <input
                    ref={correctionFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={(ev) => setFileLabel(ev.target.files?.[0]?.name ?? null)}
                  />
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button type="button" variant="outlined" onClick={() => correctionFileRef.current?.click()}>
                      Choose file
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      {fileLabel ?? 'No file chosen'}
                    </Typography>
                  </Stack>
                  {uploadMsg ? (
                    <Alert severity={uploadMsg.includes('failed') ? 'error' : 'success'}>{uploadMsg}</Alert>
                  ) : null}
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Uploading…' : 'Upload corrections'}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ) : null}

          {detail && !loading && tab === 1 ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Onboarding records uploaded under this batch. Open a row for full journey context (masked
                identifiers for portal VIEWER; images require ADMIN).
              </Typography>
              {empLoading ? <Typography color="text.secondary">Loading employees…</Typography> : null}
              {empError ? <Alert severity="error">{empError}</Alert> : null}
              {empData && !empLoading ? (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Page {empData.number + 1} of {Math.max(1, empData.totalPages)} · {empData.totalElements}{' '}
                    employees
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Employee ref</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Mobile</TableCell>
                          <TableCell>CNIC</TableCell>
                          <TableCell align="right">Detail</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {empData.content.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                              No employees in this batch yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          empData.content.map((row) => (
                            <TableRow key={row.employeeRef} hover>
                              <TableCell>
                                <Typography component="code" variant="body2">
                                  {row.employeeRef}
                                </Typography>
                              </TableCell>
                              <TableCell>{row.fullName}</TableCell>
                              <TableCell>
                                <OnboardingStatusChip status={row.status} />
                              </TableCell>
                              <TableCell>{row.mobileMasked}</TableCell>
                              <TableCell>{row.cnicMasked}</TableCell>
                              <TableCell align="right">
                                <Button
                                  component={Link}
                                  to={`/batches/${encodeURIComponent(ref ?? '')}/employees/${encodeURIComponent(row.employeeRef)}`}
                                  size="small"
                                  variant="text"
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={empPage <= 0}
                      onClick={() => setEmpPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={empData.totalPages <= 0 || empPage >= empData.totalPages - 1}
                      onClick={() => setEmpPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </Stack>
                </>
              ) : null}
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  )
}
