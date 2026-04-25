import { Chip, type ChipProps } from '@mui/material'

const STATUS_COLOR: Record<string, ChipProps['color']> = {
  INVITED: 'info',
  OTP_PENDING: 'info',
  OTP_VERIFIED: 'info',
  OCR_IN_PROGRESS: 'warning',
  OCR_FAILED: 'error',
  NADRA_PENDING: 'warning',
  NADRA_VERIFIED: 'success',
  NADRA_FAILED: 'error',
  LIVENESS_PENDING: 'warning',
  LIVENESS_PASSED: 'success',
  LIVENESS_FAILED: 'error',
  FACE_MATCH_PENDING: 'warning',
  FACE_MATCHED: 'success',
  FACE_MATCH_FAILED: 'error',
  FINGERPRINT_PENDING: 'warning',
  FINGERPRINT_MATCHED: 'success',
  FINGERPRINT_FAILED: 'error',
  QUIZ_PENDING: 'warning',
  QUIZ_PASSED: 'success',
  QUIZ_FAILED: 'error',
  FORM_PENDING: 'warning',
  FORM_SUBMITTED: 'success',
  AML_CHECK_PENDING: 'warning',
  AML_REJECTED: 'error',
  T24_PENDING: 'warning',
  T24_FAILED: 'error',
  ACCOUNT_OPENED: 'success',
  BLOCKED: 'error',
  EXPIRED: 'default',
  VALIDATED: 'success',
  UPLOADED: 'default',
  INVALID: 'error',
}

export function OnboardingStatusChip({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? 'default'
  return <Chip size="small" label={status} color={color} variant={color === 'default' ? 'outlined' : 'filled'} />
}
