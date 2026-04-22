import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { type FormEvent, useEffect, useState } from 'react'
import { usePortalOutletContext } from '../portalOutletContext'
import { apiClient } from '../api/client'
import { type SpringPage, sessionIsAdmin } from '../api/types'

type UserRow = {
  id: number
  email: string
  fullName: string
  role: string
  status: string
}

const PAGE_SIZE = 20

export function UsersPage() {
  const { session, sessionReady } = usePortalOutletContext()
  const [page, setPage] = useState(0)
  const [data, setData] = useState<SpringPage<UserRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!sessionReady) return
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const { data: body } = await apiClient.get<SpringPage<UserRow>>('/users', {
          params: { page, size: PAGE_SIZE, sort: 'email,asc' },
        })
        if (!cancelled) setData(body)
      } catch {
        if (!cancelled) {
          setError('Could not load users.')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, refresh, sessionReady])

  async function onCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    const fullName = String(fd.get('fullName') ?? '').trim()
    const role = String(fd.get('role') ?? 'VIEWER')
    if (!email || !password || !fullName) {
      setFormMsg('All fields are required.')
      return
    }
    setFormMsg(null)
    setFormBusy(true)
    try {
      await apiClient.post('/users', { email, password, fullName, role })
      setFormMsg('User created.')
      form.reset()
      setPage(0)
      setRefresh((n) => n + 1)
    } catch {
      setFormMsg('Create failed (duplicate email, weak password, or server error).')
    } finally {
      setFormBusy(false)
    }
  }

  const isAdmin = sessionReady && sessionIsAdmin(session)

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
          Users
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
        Users
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Portal accounts for your organization.
      </Typography>

      {!session ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load your session. Try signing in again.
        </Alert>
      ) : null}

      {isAdmin ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Add user
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            ADMIN only. Password must be at least 8 characters.
          </Typography>
          <Box component="form" onSubmit={onCreateUser}>
            <Stack spacing={2} sx={{ maxWidth: 400 }}>
              <TextField name="email" label="Email" type="email" autoComplete="off" required fullWidth />
              <TextField name="fullName" label="Full name" type="text" autoComplete="name" required fullWidth />
              <FormControl fullWidth>
                <InputLabel id="users-role-label">Role</InputLabel>
                <Select labelId="users-role-label" name="role" label="Role" defaultValue="VIEWER" required>
                  <MenuItem value="VIEWER">VIEWER</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="password"
                label="Initial password"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                slotProps={{ htmlInput: { minLength: 8 } }}
              />
              {formMsg ? (
                <Alert severity={formMsg.includes('failed') ? 'error' : 'success'}>{formMsg}</Alert>
              ) : null}
              <Button type="submit" disabled={formBusy}>
                {formBusy ? 'Creating…' : 'Create user'}
              </Button>
            </Stack>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You have read-only access. Ask an ADMIN to add users.
        </Typography>
      )}

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          Loading directory…
        </Typography>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {data && !loading ? (
        <>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
            Directory
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Page {data.number + 1} of {Math.max(1, data.totalPages)} · {data.totalElements} total
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.content.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.status}</TableCell>
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
