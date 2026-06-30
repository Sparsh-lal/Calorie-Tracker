import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from '../../firebase'
import { saveUserProfile } from '../../utils/firestore'
import { toggleTheme } from '../../store/slices/uiSlice'
import { setUser } from '../../store/slices/authSlice'
import { loadGuestState } from '../../store/slices/persistSlice'
import toast from 'react-hot-toast'
import styles from './AuthPage.module.css'

function toEmail(username) {
  return `${username.trim().toLowerCase()}@ct-internal.app`
}

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, x: -30, transition: { duration: 0.2 } },
}

const FEATURES = [
  { icon: '📊', text: 'Track calories & macros daily' },
  { icon: '🗓️', text: 'Monthly calendar history' },
  { icon: '🎯', text: 'TDEE-based macro goals' },
  { icon: '☁️', text: 'Synced across all your devices' },
]

// ── Landing ──────────────────────────────────────────────────────
function Landing({ onSignIn, onRegister, onGuest }) {
  return (
    <motion.div
      key="landing"
      variants={slideVariants}
      initial="initial" animate="animate" exit="exit"
      className={styles.landing}
    >
      <div className={styles.heroLogo}>🔥</div>
      <h1 className={styles.heroTitle}>Calorie <span className={styles.heroAccent}>Tracker</span></h1>
      <p className={styles.heroSub}>Your personal nutrition companion</p>

      <ul className={styles.features}>
        {FEATURES.map(f => (
          <li key={f.icon} className={styles.featureItem}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      <div className={styles.landingBtns}>
        <motion.button
          className={`btn btn-brand ${styles.landingBtn}`}
          onClick={onRegister}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        >
          Create account
        </motion.button>
        <motion.button
          className={`btn btn-outline ${styles.landingBtn}`}
          onClick={onSignIn}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        >
          Sign in
        </motion.button>
      </div>

      <div className={styles.guestDivider}>
        <span>or</span>
      </div>
      <motion.button
        className={styles.guestBtn}
        onClick={onGuest}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
      >
        👤 Continue as Guest
        <span className={styles.guestNote}>No account needed · data not saved</span>
      </motion.button>
    </motion.div>
  )
}

// ── Auth form (shared for login + register) ───────────────────────
function AuthForm({ mode, onBack }) {
  const [name,     setName]    = useState('')
  const [username, setUsername]= useState('')
  const [password, setPassword]= useState('')
  const [confirm,  setConfirm] = useState('')
  const [loading,  setLoading] = useState(false)
  const [error,    setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const trimUser = username.trim().toLowerCase()
    const trimName = name.trim()

    if (!trimUser || !password) { setError('All fields are required.'); return }
    if (!/^[a-z0-9_]{3,20}$/.test(trimUser)) {
      setError('Username: 3–20 characters, letters/numbers/underscores only.')
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
        'auth/user-not-found':       'No account found with that username.',
        'auth/wrong-password':       'Incorrect password.',
        'auth/email-already-in-use': 'That username is already taken.',
        'auth/too-many-requests':    'Too many attempts. Try again later.',
        'auth/invalid-credential':   'Incorrect username or password.',
      }[err.code] || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      key={mode}
      variants={slideVariants}
      initial="initial" animate="animate" exit="exit"
    >
      <button className={styles.backBtn} onClick={onBack} type="button">
        ← Back
      </button>

      <div className={styles.formHeader}>
        <span className={styles.formLogo}>🔥</span>
        <h2 className={styles.formTitle}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className={styles.formSub}>
          {mode === 'login' ? 'Sign in to your account' : 'Start tracking your nutrition'}
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {mode === 'register' && (
          <div className={styles.field}>
            <label className={styles.label}>Your name</label>
            <input className="input" type="text" placeholder="e.g. Sparsh"
              value={name} onChange={e => setName(e.target.value)}
              autoComplete="name" disabled={loading} />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Username</label>
          <input className="input" type="text" placeholder="e.g. sparsh_the_great"
            value={username} onChange={e => setUsername(e.target.value)}
            autoComplete="username" disabled={loading} autoFocus />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input className="input" type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            disabled={loading} />
        </div>

        {mode === 'register' && (
          <div className={styles.field}>
            <label className={styles.label}>Confirm password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password" disabled={loading} />
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.p className={styles.error}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button type="submit"
          className={`btn btn-brand ${styles.submitBtn}`}
          disabled={loading}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        >
          {loading
            ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
            : (mode === 'login' ? 'Sign in' : 'Create account')}
        </motion.button>
      </form>
    </motion.div>
  )
}

// ── Root ──────────────────────────────────────────────────────────
export default function AuthPage() {
  // 'landing' | 'login' | 'register'
  const [view, setView] = useState('landing')
  const dispatch = useDispatch()
  const theme    = useSelector(s => s.ui.theme)

  function handleGuest() {
    dispatch(setUser({ uid: 'guest', name: 'Guest', username: 'guest', isGuest: true }))
    dispatch(loadGuestState())
    toast('Browsing as guest — data won’t be saved', { icon: '👤', duration: 3500 })
  }

  return (
    <div className={styles.page}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      {/* Theme toggle */}
      <motion.button
        className={styles.themeBtn}
        onClick={() => dispatch(toggleTheme())}
        whileTap={{ scale: 0.9 }}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </motion.button>

      <div className={`card ${styles.card}`}>
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <Landing
              key="landing"
              onSignIn={() => setView('login')}
              onRegister={() => setView('register')}
              onGuest={handleGuest}
            />
          )}
          {(view === 'login' || view === 'register') && (
            <AuthForm
              key={view}
              mode={view}
              onBack={() => setView('landing')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

