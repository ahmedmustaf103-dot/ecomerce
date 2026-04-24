import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth, firebaseConfigured } from '../firebase.js'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

function mapAuthError(err) {
  const code = err?.code
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
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled in Firebase. In Firebase Console → Authentication → Sign-in method, enable Email/Password and/or Google.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Allow pop-ups for this site and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.'
    default:
      return code
        ? `Sign-in failed (${code}). ${err?.message || ''}`.trim()
        : err?.message || 'Something went wrong'
  }
}

function AccountPage({ user, onSignOut }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState(null)

  if (!firebaseConfigured || !auth) {
    return (
      <section className="page narrow">
        <h1>Account</h1>
        <div className="empty-state">
          <p>Firebase is not configured yet, so Google sign-in, email/password, and password reset are hidden.</p>
          <p>
            Add the <code>VITE_FIREBASE_*</code> keys from the Firebase console to <code>.env</code> (see{' '}
            <code>.env.example</code>), restart <code>npm run dev</code>, then return here.
          </p>
          <p className="page-subtitle">
            On Vercel, add the same variables under Project Settings → Environment Variables and redeploy.
          </p>
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
        const cred = await createUserWithEmailAndPassword(auth, trimmed, password)
        if (cred.user && !cred.user.emailVerified) {
          try {
            await sendEmailVerification(cred.user)
            setVerifyMessage('We sent a verification link to your email.')
          } catch {
            setVerifyMessage(null)
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, trimmed, password)
      }
      setPassword('')
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setVerifyMessage(null)
    setGoogleLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your email above, then click “Forgot password?”.')
      return
    }
    setError(null)
    setResetMessage(null)
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, trimmed)
      setResetMessage('Check your inbox for a reset link.')
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setResetLoading(false)
    }
  }

  const handleResendVerification = async () => {
    const u = auth.currentUser
    if (!u || u.emailVerified) return
    setVerifyMessage(null)
    setError(null)
    setVerifyLoading(true)
    try {
      await sendEmailVerification(u)
      setVerifyMessage('Verification email sent again.')
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleSignOut = () => {
    onSignOut()
    setPassword('')
    setError(null)
    setResetMessage(null)
    setVerifyMessage(null)
  }

  if (user) {
    const needsVerify = user.emailVerified === false
    return (
      <section className="page narrow">
        <h1>Account</h1>
        <p className="page-subtitle">You are signed in.</p>

        <div className="empty-state">
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
          {needsVerify ? (
            <div className="account-verify-banner">
              <p>Your email is not verified yet.</p>
              <button
                className="button secondary"
                type="button"
                disabled={verifyLoading}
                onClick={handleResendVerification}
              >
                {verifyLoading ? 'Sending…' : 'Resend verification email'}
              </button>
            </div>
          ) : null}
          {verifyMessage ? <p className="page-subtitle">{verifyMessage}</p> : null}
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
            setResetMessage(null)
            setVerifyMessage(null)
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
            setResetMessage(null)
            setVerifyMessage(null)
          }}
        >
          Register
        </button>
      </div>

      <div className="account-oauth">
        <button
          className="button secondary account-google"
          type="button"
          disabled={googleLoading || loading}
          onClick={handleGoogle}
        >
          {googleLoading ? 'Opening Google…' : 'Continue with Google'}
        </button>
      </div>

      <p className="account-divider" aria-hidden="true">
        or use email
      </p>

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
        {mode === 'login' ? (
          <p className="account-forgot">
            <button type="button" className="link-button" onClick={handlePasswordReset} disabled={resetLoading}>
              {resetLoading ? 'Sending…' : 'Forgot password?'}
            </button>
          </p>
        ) : null}
        {resetMessage ? <p className="page-subtitle">{resetMessage}</p> : null}
        {verifyMessage ? <p className="page-subtitle">{verifyMessage}</p> : null}
        {error ? <p className="account-error">{error}</p> : null}
        <button className="button" type="submit" disabled={loading || googleLoading}>
          {loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign In'}
        </button>
      </form>
    </section>
  )
}

export default AccountPage
