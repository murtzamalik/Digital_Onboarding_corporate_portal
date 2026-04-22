import {
  Alert,
  Box,
  Button,
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
        Notifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Email delivery log for addresses belonging to users in your organization (e.g. password reset). Payload
        details stay on the server.
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

      {data && !loading && data.totalElements === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No notification rows yet for your team&apos;s addresses.
        </Typography>
      ) : null}

      {data && !loading && data.totalElements > 0 ? (
        <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Page {data.number + 1} of {Math.max(1, data.totalPages)} · {data.totalElements} total
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Sent</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.content.map((n) => (
                  <TableRow key={n.id} hover>
                    <TableCell>{formatWhen(n.createdAt)}</TableCell>
                    <TableCell>
                      <Typography component="code" variant="body2">
                        {n.templateKey}
                      </Typography>
                    </TableCell>
                    <TableCell>{n.status}</TableCell>
                    <TableCell>{n.recipientEmail}</TableCell>
                    <TableCell>{formatWhen(n.sentAt)}</TableCell>
                    <TableCell>
                      {n.errorMessage ? (
                        <Typography component="span" title={n.errorMessage} variant="body2">
                          Yes
                        </Typography>
                      ) : (
                        '—'
                      )}
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
            <Button
              variant="outlined"
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </Stack>
        </>
      ) : null}
    </Box>
  )
}
