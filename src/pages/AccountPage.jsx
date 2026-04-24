import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth, firebaseConfigured } from '../firebase/config.js'

function mapAuthError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password'
    default:
      return 'Something went wrong'
  }
}

function AccountPage({ user, onSignOut }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!firebaseConfigured || !auth) {
    return (
      <section className="page narrow">
        <h1>Account</h1>
        <div className="empty-state">
          <p>Firebase is not configured for this deployment.</p>
          <p>Add your web app keys to <code>.env</code> (see <code>.env.example</code>).</p>
        </div>
      </section>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const trimmed = email.trim()
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, trimmed, password)
      } else {
        await signInWithEmailAndPassword(auth, trimmed, password)
      }
      setPassword('')
    } catch (err) {
      setError(mapAuthError(err?.code))
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
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
        Create an account or sign in with Firebase. Use at least 8 characters for a new password.
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
