import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Stack,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
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
        Dashboard
      </Typography>

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
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{batches.totalElements}</strong> batch{batches.totalElements === 1 ? '' : 'es'} total.
          </Typography>
          {batches.content.length > 0 ? (
            <List dense disablePadding sx={{ mb: 2, maxWidth: 560 }}>
              {batches.content.map((b) => (
                <ListItem key={b.id} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <MuiLink component={Link} to={`/batches/${encodeURIComponent(b.batchReference)}`}>
                        {b.batchReference}
                      </MuiLink>
                    }
                    secondary={`${b.status} · ${b.validRowCount}/${b.totalRows} valid`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No batches yet. Upload one from the Batches page.
            </Typography>
          )}
          <Typography variant="body2">
            <MuiLink component={Link} to="/batches">
              View all batches
            </MuiLink>
          </Typography>
        </>
      ) : null}

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0 }}>
        Status-driven data comes from <code>/api/v1/portal/session</code> and <code>/api/v1/portal/batches</code>.
      </Typography>
    </Box>
  )
}
