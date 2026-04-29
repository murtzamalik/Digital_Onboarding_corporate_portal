import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
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
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
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

export function MyBatchesPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<SpringPage<BatchRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
  }, [page])

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h1">
        My Batches
      </Typography>
      {loading ? <Typography color="text.secondary">Loading...</Typography> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {data ? (
        <>
          <Typography variant="body2" color="text.secondary">
            {data.totalElements} batches (page {data.number + 1} of {Math.max(1, data.totalPages)})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Batch ID</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Opened</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.content.map((b, index) => (
                  <TableRow key={b.id} hover sx={{ backgroundColor: index % 2 ? '#FAFBFC' : '#FFFFFF' }}>
                    <TableCell>
                      <MuiLink component={RouterLink} to={`/batches/${encodeURIComponent(b.batchReference)}`} underline="hover">
                        {b.batchReference}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{b.createdAt}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={b.status}
                        color={b.status.toUpperCase().includes('COMPLETE') ? 'success' : b.status.toUpperCase().includes('FAIL') ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{b.totalRows}</TableCell>
                    <TableCell>{b.validRowCount}</TableCell>
                    <TableCell>{b.invalidRowCount}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.round((b.validRowCount / Math.max(1, b.totalRows)) * 100)}
                        sx={{ height: 8, borderRadius: 6, bgcolor: '#E2E8F0' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Previous
              </Button>
              <Button variant="outlined" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </Stack>
          </Box>
        </>
      ) : null}
    </Stack>
  )
}
