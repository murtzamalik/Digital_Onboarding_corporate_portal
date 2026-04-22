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
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { runtimeConfig } from '../config/runtime'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await axios.post<{ message: string }>(
        `${runtimeConfig.apiBaseUrl}/auth/forgot-password`,
        { email },
      )
      setDone(true)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        setError('Too many requests. Try again in a minute.')
      } else {
        setError('Could not start reset. Check your connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

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
          <Typography variant="h5" component="h1" gutterBottom>
            Reset password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your portal email. If we find a matching account, you will receive reset instructions.
          </Typography>

          {done ? (
            <Stack spacing={2}>
              <Alert severity="info" role="status">
                If an account exists for this email, password reset instructions have been sent.
              </Alert>
              <Typography variant="body2">
                <MuiLink component={Link} to="/login" underline="hover">
                  Back to sign in
                </MuiLink>
              </Typography>
            </Stack>
          ) : (
            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                  fullWidth
                />
                {error ? <Alert severity="error">{error}</Alert> : null}
                <Button type="submit" disabled={busy} fullWidth size="large">
                  {busy ? 'Sending…' : 'Send reset link'}
                </Button>
                <Typography variant="body2">
                  <MuiLink component={Link} to="/login" underline="hover">
                    Back to sign in
                  </MuiLink>
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
