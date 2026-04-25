import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { type PortalOutletContextValue } from '../portalOutletContext'
import { apiClient } from '../api/client'
import { type PortalSession } from '../api/types'
import { clearPortalAccessToken } from '../auth/token'

const navButtonSx = {
  textTransform: 'none' as const,
  fontWeight: 500,
  color: 'text.secondary',
  '&[aria-current="page"]': { color: 'primary.main', bgcolor: 'action.selected' },
}

export function MainLayout() {
  const navigate = useNavigate()
  const [session, setSession] = useState<PortalSession | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await apiClient.get<PortalSession>('/session')
        if (!cancelled) setSession(data)
      } catch {
        if (!cancelled) setSession(null)
      } finally {
        if (!cancelled) setSessionReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function signOut() {
    clearPortalAccessToken()
    navigate('/login', { replace: true })
  }

  const outletContext: PortalOutletContextValue = { session, sessionReady }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          background: (t) =>
            `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.action.hover} 100%)`,
        }}
      >
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1, py: 1.25 }}>
          <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700, mr: 2, letterSpacing: '0.04em' }}>
            CEBOS · Corporate
          </Typography>
          {!sessionReady ? (
            <Chip size="small" label="Loading session…" variant="outlined" sx={{ mr: 1 }} />
          ) : session ? (
            <Chip
              size="small"
              label={`User ${session.portalUserId}`}
              variant="outlined"
              sx={{ mr: 1, display: { xs: 'none', sm: 'flex' } }}
            />
          ) : null}
          <Box component="nav" aria-label="Main" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flex: 1 }}>
            <Button component={NavLink} to="/dashboard" sx={navButtonSx}>
              Dashboard
            </Button>
            <Button component={NavLink} to="/batches" sx={navButtonSx}>
              Batches
            </Button>
            <Button component={NavLink} to="/reports" sx={navButtonSx}>
              Reports
            </Button>
            <Button component={NavLink} to="/notifications" sx={navButtonSx}>
              Notifications
            </Button>
            <Button component={NavLink} to="/users" sx={navButtonSx}>
              Users
            </Button>
          </Box>
          <Button variant="outlined" color="inherit" onClick={signOut} sx={{ textTransform: 'none' }}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, py: 3, px: 2, bgcolor: 'background.default' }}>
        <Container maxWidth="xl">
          <Outlet context={outletContext} />
        </Container>
      </Box>
    </Box>
  )
}
