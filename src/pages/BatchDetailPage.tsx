import { Alert, Box, Button, Divider, Link as MuiLink, Stack, Typography } from '@mui/material'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiClient } from '../api/client'
import { sessionIsAdmin } from '../api/types'
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

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Stack>
  )
}

export function BatchDetailPage() {
  const { ref } = useParams<{ ref: string }>()
  const { session, sessionReady } = usePortalOutletContext()
  const correctionFileRef = useRef<HTMLInputElement>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [detail, setDetail] = useState<BatchDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)

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
        Batch
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/batches" underline="hover">
          ← All batches
        </MuiLink>
      </Typography>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {detail && !loading ? (
        <>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <DetailRow label="Reference">
              <Typography component="code" variant="body2">
                {detail.batchReference}
              </Typography>
            </DetailRow>
            <DetailRow label="Original file">{detail.originalFilename}</DetailRow>
            <DetailRow label="Status">{detail.status}</DetailRow>
            <DetailRow label="Rows">
              {detail.totalRows} total · {detail.validRowCount} valid · {detail.invalidRowCount} invalid
            </DetailRow>
          </Stack>

          {isAdmin ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Send invites (bulk)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                ADMIN only. Moves VALIDATED employees in this batch to INVITED (server-limited batch size per
                request) and queues invite SMS when a mobile number is present.
              </Typography>
              {inviteMsg ? (
                <Alert severity={inviteMsg.includes('failed') ? 'error' : 'success'} sx={{ mb: 2 }}>
                  {inviteMsg}
                </Alert>
              ) : null}
              <Button variant="contained" color="secondary" disabled={inviteBusy} onClick={() => void onDispatchInvites()}>
                {inviteBusy ? 'Dispatching…' : 'Dispatch invites for this batch'}
              </Button>
            </>
          ) : null}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Correction upload
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            ADMIN role only. Expects correction Excel per CEBOS rules.
          </Typography>
          <Box component="form" onSubmit={onCorrectionSubmit}>
            <Stack spacing={2} sx={{ maxWidth: 400 }}>
              <input
                ref={correctionFileRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={(ev) => setFileLabel(ev.target.files?.[0]?.name ?? null)}
              />
              <Stack spacing={2} sx={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
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
        </>
      ) : null}
    </Box>
  )
}
