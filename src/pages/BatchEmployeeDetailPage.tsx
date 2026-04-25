import {
  Alert,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBatchEmployeeDetail, type PortalEmployeeDetail } from '../api/batchEmployees'
import { sessionIsAdmin } from '../api/types'
import { OnboardingStatusChip } from '../components/StatusChip'
import { usePortalOutletContext } from '../portalOutletContext'
import { runtimeConfig } from '../config/runtime'
import { getPortalAccessToken } from '../auth/token'

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box sx={{ py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value && String(value).trim() !== '' ? value : '—'}
      </Typography>
    </Box>
  )
}

export function BatchEmployeeDetailPage() {
  const { ref, employeeRef } = useParams<{ ref: string; employeeRef: string }>()
  const { session, sessionReady } = usePortalOutletContext()
  const [detail, setDetail] = useState<PortalEmployeeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const isAdmin = sessionReady && sessionIsAdmin(session)

  const imageUrls = useMemo(() => {
    if (!ref || !employeeRef || !isAdmin) return null
    const base = runtimeConfig.apiBaseUrl
    const token = getPortalAccessToken()
    if (!token) return null
    const enc = (s: string) => encodeURIComponent(s)
    const path = (kind: string) =>
      `${base}/batches/${enc(ref)}/employees/${enc(employeeRef)}/images/${kind}`
    return { front: path('front'), back: path('back'), selfie: path('selfie'), token }
  }, [ref, employeeRef, isAdmin])

  useEffect(() => {
    if (!ref || !employeeRef) return
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const data = await fetchBatchEmployeeDetail(ref, employeeRef)
        if (!cancelled) setDetail(data)
      } catch {
        if (!cancelled) {
          setError('Could not load employee record.')
          setDetail(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ref, employeeRef])

  return (
    <Stack spacing={2}>
      <Breadcrumbs sx={{ typography: 'body2' }}>
        <MuiLink component={Link} to="/batches" underline="hover" color="inherit">
          Batches
        </MuiLink>
        <MuiLink component={Link} to={`/batches/${encodeURIComponent(ref ?? '')}`} underline="hover" color="inherit">
          {ref}
        </MuiLink>
        <Typography color="text.primary">{employeeRef}</Typography>
      </Breadcrumbs>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : null}
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : null}

      {detail && !loading ? (
        <>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              {detail.fullName}
            </Typography>
            <OnboardingStatusChip status={detail.status} />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ flex: '1 1 320px', minWidth: 280 }}>
              <CardContent>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 700 }}>
                  Identity & contact
                </Typography>
                <DetailItem label="Employee ref" value={detail.employeeRef} />
                <DetailItem label="CNIC (masked)" value={detail.cnicMasked} />
                <DetailItem label="Mobile (masked)" value={detail.mobileMasked} />
                <DetailItem label="Email" value={detail.email} />
                <DetailItem label="Father name" value={detail.fatherName} />
                <DetailItem label="Mother name" value={detail.motherName} />
                <DetailItem label="Date of birth" value={detail.dateOfBirth} />
                <DetailItem label="Gender" value={detail.gender} />
                <DetailItem label="CNIC issue" value={detail.cnicIssueDate} />
                <DetailItem label="CNIC expiry" value={detail.cnicExpiryDate} />
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: '1 1 320px', minWidth: 280 }}>
              <CardContent>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 700 }}>
                  Addresses
                </Typography>
                <DetailItem label="Present" value={[detail.presentAddressLine1, detail.presentCity].filter(Boolean).join(', ') || null} />
                <DetailItem label="Permanent" value={[detail.permanentAddressLine1, detail.permanentCity].filter(Boolean).join(', ') || null} />
              </CardContent>
            </Card>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ flex: '1 1 320px', minWidth: 280 }}>
              <CardContent>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 700 }}>
                  Journey & compliance
                </Typography>
                <DetailItem label="Invite sent" value={detail.inviteSentAt} />
                <DetailItem label="Expires" value={detail.expireAt} />
                <DetailItem label="AML status" value={detail.amlScreeningStatus} />
                <DetailItem label="AML case" value={detail.amlCaseReference} />
                <DetailItem label="T24 customer" value={detail.t24CustomerId} />
                <DetailItem label="T24 account" value={detail.t24AccountId} />
                <DetailItem label="T24 status" value={detail.t24SubmissionStatus} />
                <DetailItem label="Validation errors" value={detail.validationErrors} />
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: '1 1 320px', minWidth: 280 }}>
              <CardContent>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 700 }}>
                  Form data (JSON)
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    fontSize: 12,
                    maxHeight: 220,
                    overflow: 'auto',
                  }}
                >
                  {detail.formDataJson ?? '—'}
                </Box>
              </CardContent>
            </Card>
          </Stack>

          {isAdmin && imageUrls && (detail.hasCnicFrontImage || detail.hasCnicBackImage || detail.hasSelfieImage) ? (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                KYC images (portal ADMIN)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Images are loaded with your session. CNIC and biometric data — handle per bank policy.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {detail.hasCnicFrontImage ? (
                  <Box sx={{ flex: '1 1 200px', maxWidth: 400 }}>
                    <Typography variant="caption" color="text.secondary">
                      CNIC front
                    </Typography>
                    <AuthImage src={imageUrls.front} token={imageUrls.token} alt="CNIC front" />
                  </Box>
                ) : null}
                {detail.hasCnicBackImage ? (
                  <Box sx={{ flex: '1 1 200px', maxWidth: 400 }}>
                    <Typography variant="caption" color="text.secondary">
                      CNIC back
                    </Typography>
                    <AuthImage src={imageUrls.back} token={imageUrls.token} alt="CNIC back" />
                  </Box>
                ) : null}
                {detail.hasSelfieImage ? (
                  <Box sx={{ flex: '1 1 200px', maxWidth: 400 }}>
                    <Typography variant="caption" color="text.secondary">
                      Selfie
                    </Typography>
                    <AuthImage src={imageUrls.selfie} token={imageUrls.token} alt="Selfie" />
                  </Box>
                ) : null}
              </Stack>
            </>
          ) : null}
        </>
      ) : null}
    </Stack>
  )
}

function AuthImage({ src, token, alt }: { src: string; token: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    ;(async () => {
      try {
        const res = await fetch(src, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('bad')
        const blob = await res.blob()
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) setUrl(objectUrl)
      } catch {
        if (!cancelled) setErr(true)
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src, token])

  if (err) return <Typography color="error">Could not load image.</Typography>
  if (!url) return <Typography color="text.secondary">Loading image…</Typography>
  return (
    <Box
      component="img"
      src={url}
      alt={alt}
      sx={{
        width: '100%',
        maxHeight: 280,
        objectFit: 'contain',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        mt: 0.5,
        display: 'block',
      }}
    />
  )
}
