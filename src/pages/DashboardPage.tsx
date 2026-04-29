import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Link as MuiLink,
  LinearProgress,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export function DashboardPage() {
  const { session, sessionReady } = usePortalOutletContext()
  const [batches, setBatches] = useState<SpringPage<BatchRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionReady) return
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const { data } = await apiClient.get<SpringPage<BatchRow>>('/batches', {
          params: { page: 0, size: 5, sort: 'createdAt,desc' },
        })
        if (!cancelled) setBatches(data)
      } catch {
        if (!cancelled) {
          setError('Could not load dashboard. Sign in again or check the API.')
          setBatches(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionReady])

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
        Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Account onboarding overview for your company.
        </Typography>
      </Box>

      {!sessionReady ? (
        <Stack spacing={1} sx={{ py: 2, flexDirection: 'row', alignItems: 'center' }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        </Stack>
      ) : !session ? (
        <Alert severity="warning">Could not load your session. Try signing in again.</Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Signed in as portal user <code>{session.portalUserId}</code>
          {session.corporateClientId != null ? (
            <>
              {' '}
              · Client <code>{session.corporateClientId}</code>
            </>
          ) : null}
        </Typography>
      )}

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          Loading batches…
        </Typography>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {batches && !loading && sessionReady ? (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #64748B' }}>
              <Typography variant="caption" color="text.secondary">Total Submitted</Typography>
              <Typography variant="h4">{batches.totalElements}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #7C3AED' }}>
              <Typography variant="caption" color="text.secondary">Invites Sent</Typography>
              <Typography variant="h4">{batches.content.reduce((s, b) => s + b.validRowCount, 0)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #16A34A' }}>
              <Typography variant="caption" color="text.secondary">Accounts Opened</Typography>
              <Typography variant="h4">{batches.content.reduce((s, b) => s + (b.validRowCount - b.invalidRowCount), 0)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #DC2626' }}>
              <Typography variant="caption" color="text.secondary">Failed</Typography>
              <Typography variant="h4">{batches.content.reduce((s, b) => s + b.invalidRowCount, 0)}</Typography>
            </Paper>
          </Box>
          {batches.content[0] ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2">Current Batch Progress ({batches.content[0].batchReference})</Typography>
              <Typography variant="caption" color="text.secondary">
                {batches.content[0].totalRows} employees
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.round((batches.content[0].validRowCount / Math.max(1, batches.content[0].totalRows)) * 100)}
                sx={{ mt: 1, height: 10, borderRadius: 6 }}
              />
            </Paper>
          ) : null}
          <Typography variant="body2">
            <MuiLink component={Link} to="/batches">
              View all batches
            </MuiLink>
          </Typography>
        </>
      ) : null}

      <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0 }}>
        Status-driven data comes from <code>/api/v1/portal/session</code> and <code>/api/v1/portal/batches</code>.
      </Typography>
    </Stack>
  )
}
