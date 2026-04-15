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
    <section className="page">
      <h1 className="page__title">Reset password</h1>
      <p className="page__lead">
        Enter your portal email. If we find a matching account, you will receive reset
        instructions.
      </p>
      {done ? (
        <div className="page__stack">
          <p className="page__notice" role="status">
            If an account exists for this email, password reset instructions have been sent.
          </p>
          <p className="page__notice">
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      ) : (
        <form className="page__form" onSubmit={onSubmit}>
          <label className="page__label">
            Email
            <input
              className="page__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </label>
          {error ? <p className="page__error">{error}</p> : null}
          <button className="page__button" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="page__notice">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      )}
    </section>
  )
}
