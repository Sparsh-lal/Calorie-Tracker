import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from '../../firebase'
import { saveUserProfile } from '../../utils/firestore'
import toast from 'react-hot-toast'
import styles from './AuthPage.module.css'

// Internally we derive a synthetic email from the username so Firebase
// Auth (which requires an email) works with a pure username/password UX.
function toEmail(username) {
  return `${username.trim().toLowerCase()}@ct-internal.app`
}

const cardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.2 } },
}

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'

  // Register fields
  const [name,     setName]     = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')

  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState('')

  function resetForm() {
    setName(''); setUsername(''); setPassword(''); setConfirm(''); setError('')
  }
  function switchMode(m) { resetForm(); setMode(m) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimUser = username.trim().toLowerCase()
    const trimName = name.trim()

    if (!trimUser || !password) { setError('All fields are required.'); return }
    if (!/^[a-z0-9_]{3,20}$/.test(trimUser)) {
      setError('Username must be 3-20 characters: letters, numbers, underscores only.')
      return
    }

    if (mode === 'register') {
      if (!trimName) { setError('Please enter your name.'); return }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
      if (password !== confirm) { setError('Passwords do not match.'); return }
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, toEmail(trimUser), password)
        await updateProfile(cred.user, { displayName: trimName })
        await saveUserProfile(cred.user.uid, { name: trimName, username: trimUser })
        toast.success(`Welcome, ${trimName}! 🎉`)
      } else {
        await signInWithEmailAndPassword(auth, toEmail(trimUser), password)
        toast.success('Signed in!')
      }
    } catch (err) {
      const msg = {
        'auth/user-not-found':    'No account found with that username.',
        'auth/wrong-password':    'Incorrect password.',
        'auth/email-already-in-use': 'That username is already taken.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/invalid-credential': 'Incorrect username or password.',
      }[err.code] || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className={`card ${styles.card}`}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Logo */}
          <div className={styles.logo}>🔥</div>
          <h1 className={styles.appName}>Calorie Tracker</h1>
          <p className={styles.tagline}>
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label}>Your name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Sparsh"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. sparsh_lal"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                disabled={loading}
              />
            </div>

            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label}>Confirm password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  className={styles.error}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className={`btn btn-brand ${styles.submitBtn}`}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign in' : 'Create account')}
            </motion.button>
          </form>

          <p className={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className={styles.switchBtn}
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              type="button"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
