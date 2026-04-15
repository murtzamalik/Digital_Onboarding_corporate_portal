import { type FormEvent, useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { type PortalSession, type SpringPage, sessionIsAdmin } from '../api/types'

type UserRow = {
  id: number
  email: string
  fullName: string
  role: string
  status: string
}

const PAGE_SIZE = 20

export function UsersPage() {
  const [page, setPage] = useState(0)
  const [session, setSession] = useState<PortalSession | null>(null)
  const [data, setData] = useState<SpringPage<UserRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: s } = await apiClient.get<PortalSession>('/session')
        if (!cancelled) setSession(s)
      } catch {
        if (!cancelled) setSession(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
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
  }, [page, refresh])

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

  const isAdmin = sessionIsAdmin(session)

  return (
    <section className="page">
      <h1 className="page__title">Users</h1>
      <p className="page__lead">Portal accounts for your organization.</p>
      {loading ? <p className="page__stub">Loading…</p> : null}
      {error ? <p className="page__error">{error}</p> : null}

      {isAdmin ? (
        <>
          <h2 className="page__title" style={{ fontSize: '1.1rem' }}>
            Add user
          </h2>
          <p className="page__notice">ADMIN only. Password must be at least 8 characters.</p>
          <form className="page__form" onSubmit={onCreateUser}>
            <label className="page__label">
              Email
              <input className="page__input" name="email" type="email" autoComplete="off" required />
            </label>
            <label className="page__label">
              Full name
              <input className="page__input" name="fullName" type="text" autoComplete="name" required />
            </label>
            <label className="page__label">
              Role
              <select className="page__input" name="role" defaultValue="VIEWER">
                <option value="VIEWER">VIEWER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <label className="page__label">
              Initial password
              <input
                className="page__input"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            {formMsg ? <p className="page__notice">{formMsg}</p> : null}
            <button className="page__button" type="submit" disabled={formBusy}>
              {formBusy ? 'Creating…' : 'Create user'}
            </button>
          </form>
        </>
      ) : (
        <p className="page__notice">You have read-only access. Ask an ADMIN to add users.</p>
      )}

      {data && !loading ? (
        <>
          <h2 className="page__title" style={{ fontSize: '1.1rem', marginTop: '1.5rem' }}>
            Directory
          </h2>
          <p className="page__lead">
            Page {data.number + 1} of {Math.max(1, data.totalPages)} · {data.totalElements} total
          </p>
          <div className="table-wrap">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.fullName}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button
              type="button"
              className="page__button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="page__button"
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
