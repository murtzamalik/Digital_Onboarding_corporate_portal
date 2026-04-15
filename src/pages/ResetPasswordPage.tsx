import axios, { isAxiosError } from 'axios'
import { type FormEvent, useMemo, useState } from 'react'
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
      <section className="page">
        <h1 className="page__title">Invalid reset link</h1>
        <p className="page__lead">This page needs a valid token from your email.</p>
        <p className="page__notice">
          <Link to="/forgot-password">Request a new reset link</Link>
          {' · '}
          <Link to="/login">Sign in</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="page__title">Choose a new password</h1>
      <p className="page__lead">Enter a new password for your corporate portal account.</p>
      {done ? (
        <div className="page__stack">
          <p className="page__notice" role="status">
            Password has been updated. You can sign in with the new password.
          </p>
          <p className="page__notice">
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      ) : (
        <form className="page__form" onSubmit={onSubmit}>
          <label className="page__label">
            New password
            <input
              className="page__input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              minLength={8}
            />
          </label>
          <label className="page__label">
            Confirm password
            <input
              className="page__input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(ev) => setConfirm(ev.target.value)}
              required
              minLength={8}
            />
          </label>
          {error ? <p className="page__error">{error}</p> : null}
          <button className="page__button" type="submit" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
          <p className="page__notice">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      )}
    </section>
  )
}
