import {
  Alert,
  Box,
  Button,
  Container,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import axios, { isAxiosError } from 'axios'
import { type FormEvent, type ReactNode, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { runtimeConfig } from '../config/runtime'

function readApiError(err: unknown): string | null {
  if (!isAxiosError(err)) return null
  const data = err.response?.data
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error
  }
  return null
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, border: 1, borderColor: 'divider' }}>
          {children}
        </Paper>
      </Container>
    </Box>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await axios.post<{ message: string }>(
        `${runtimeConfig.apiBaseUrl}/auth/reset-password`,
        { token, newPassword: password },
      )
      setDone(true)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        setError('Too many requests. Try again in a minute.')
      } else {
        const api = readApiError(err)
        setError(
          api ?? 'Could not reset password. The link may be invalid, expired, or already used.',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <Typography variant="h5" component="h1" gutterBottom>
          Invalid reset link
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This page needs a valid token from your email.
        </Typography>
        <Typography variant="body2">
          <MuiLink component={Link} to="/forgot-password" underline="hover">
            Request a new reset link
          </MuiLink>
          {' · '}
          <MuiLink component={Link} to="/login" underline="hover">
            Sign in
          </MuiLink>
        </Typography>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Typography variant="h5" component="h1" gutterBottom>
        Choose a new password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter a new password for your corporate portal account.
      </Typography>
      {done ? (
        <Stack spacing={2}>
          <Alert severity="success" role="status">
            Password has been updated. You can sign in with the new password.
          </Alert>
          <Typography variant="body2">
            <MuiLink component={Link} to="/login" underline="hover">
              Sign in
            </MuiLink>
          </Typography>
        </Stack>
      ) : (
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 8 } }}
            />
            <TextField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(ev) => setConfirm(ev.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 8 } }}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button type="submit" disabled={busy} fullWidth size="large">
              {busy ? 'Updating…' : 'Update password'}
            </Button>
            <Typography variant="body2">
              <MuiLink component={Link} to="/login" underline="hover">
                Back to sign in
              </MuiLink>
            </Typography>
          </Stack>
        </Box>
      )}
    </AuthShell>
  )
}
