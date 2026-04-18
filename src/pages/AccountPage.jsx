import { useState } from 'react'
import { apiUrl, setStoredToken } from '../api/client.js'

function AccountPage({ user, onAuthSuccess, onSignOut }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
    try {
      const res = await fetch(apiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Something went wrong')
        return
      }
      if (!data.token || !data.user) {
        setError('Unexpected response from server')
        return
      }
      setStoredToken(data.token)
      onAuthSuccess(data)
      setPassword('')
    } catch {
      setError('Network error. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    setStoredToken(null)
    onSignOut()
    setPassword('')
    setError(null)
  }

  if (user) {
    return (
      <section className="page narrow">
        <h1>Account</h1>
        <p className="page-subtitle">You are signed in.</p>

        <div className="empty-state">
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
          <div className="details-actions">
            <button className="button secondary" type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page narrow">
      <h1>Account</h1>
      <p className="page-subtitle">
        Create an account or sign in to place orders. Passwords must be at least 8 characters.
      </p>

      <div className="account-tabs" role="tablist" aria-label="Sign in or register">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          className={`button secondary account-tab${mode === 'login' ? ' account-tab-active' : ''}`}
          onClick={() => {
            setMode('login')
            setError(null)
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          className={`button secondary account-tab${mode === 'register' ? ' account-tab-active' : ''}`}
          onClick={() => {
            setMode('register')
            setError(null)
          }}
        >
          Register
        </button>
      </div>

      <form className="account-form" onSubmit={handleSubmit}>
        <label className="account-label">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="account-label">
          Password
          <input
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === 'register' ? 8 : undefined}
            required
          />
        </label>
        {error ? <p className="account-error">{error}</p> : null}
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign In'}
        </button>
      </form>
    </section>
  )
}

export default AccountPage
