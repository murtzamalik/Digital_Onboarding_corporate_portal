import axios from 'axios'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setPortalTokens } from '../auth/token'
import { runtimeConfig } from '../config/runtime'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${runtimeConfig.apiBaseUrl}/auth/login`,
        { email, password },
      )
      setPortalTokens(data.accessToken, data.refreshToken)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Login failed. Check email, password, and that the API is running.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page">
      <h1 className="page__title">Corporate portal login</h1>
      <form className="page__form" onSubmit={onSubmit}>
        <label className="page__label">
          Email
          <input
            className="page__input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
        </label>
        <label className="page__label">
          Password
          <input
            className="page__input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
        </label>
        {error ? <p className="page__error">{error}</p> : null}
        <button className="page__button" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="page__notice">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </form>
    </section>
  )
}
