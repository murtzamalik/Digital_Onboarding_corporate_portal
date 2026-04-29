import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { type PortalOutletContextValue } from '../portalOutletContext'
import { apiClient } from '../api/client'
import { type PortalSession } from '../api/types'
import { clearPortalAccessToken } from '../auth/token'

const drawerWidth = 240

function NavListItem({ to, end, label }: { to: string; end?: boolean; label: string }) {
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <NavLink to={to} end={end} style={{ textDecoration: 'none', color: 'inherit' }}>
        {({ isActive }) => (
          <ListItemButton
            selected={isActive}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.25,
              color: isActive ? '#FFFFFF' : '#94A3B8',
              backgroundColor: isActive ? '#065F46' : 'transparent',
              '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: '#065F46' },
              '&:hover': { backgroundColor: '#1E3A5F' },
            }}
          >
            <ListItemText primary={label} slotProps={{ primary: { variant: 'body2' } }} />
          </ListItemButton>
        )}
      </NavLink>
    </ListItem>
  )
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
        <Toolbar sx={{ gap: 2, py: 0.5, justifyContent: 'space-between' }}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700, letterSpacing: '0.04em' }}>
              CEBOS · Corporate portal
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {sessionReady && session
                ? `Company ${session.corporateClientId ?? '-'} · User ${session.portalUserId}`
                : 'Loading session...'}
            </Typography>
          </Stack>
          <Button variant="outlined" color="inherit" onClick={signOut} sx={{ textTransform: 'none' }}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              position: 'relative',
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: '#0F2044',
              color: '#94A3B8',
            },
          }}
          open
        >
          <List dense sx={{ pt: 1 }}>
            <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: '#475569', letterSpacing: 1 }}>
              OVERVIEW
            </Typography>
            <NavListItem to="/dashboard" label="Dashboard" />
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: '#475569', letterSpacing: 1 }}>
              BATCHES
            </Typography>
            <NavListItem to="/batches/upload" label="Upload New Batch" />
            <NavListItem to="/batches" end label="My Batches" />
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: '#475569', letterSpacing: 1 }}>
              EMPLOYEES
            </Typography>
            <NavListItem to="/invites" label="Invite Management" />
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: '#475569', letterSpacing: 1 }}>
              REPORTS
            </Typography>
            <NavListItem to="/reports" label="Download Reports" />
          </List>
        </Drawer>
        <Box component="main" sx={{ flex: 1, py: 3, px: 2, bgcolor: 'background.default', overflow: 'auto' }}>
          <Container maxWidth="xl">
            <Outlet context={outletContext} />
          </Container>
        </Box>
      </Box>
    </Box>
  )
}
