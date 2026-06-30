import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { setUser, clearUser } from './store/slices/authSlice'
import { clearEntries } from './store/slices/foodLogSlice'
import { resetGoals } from './store/slices/goalsSlice'
import { resetCustomFoods } from './store/slices/customFoodsSlice'
import { resetPresets } from './store/slices/presetsSlice'
import Header from './components/Header/Header'
import NavTabs from './components/Nav/NavTabs'
import DashboardPage from './components/Dashboard/DashboardPage'
import HistoryPage from './components/History/HistoryPage'
import GoalsPage from './components/Goals/GoalsPage'
import PresetsPage from './components/Presets/PresetsPage'
import AdminPage from './components/Admin/AdminPage'
import AuthPage from './components/Auth/AuthPage'
import { loadState } from './store/slices/persistSlice'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function App() {
  const dispatch     = useDispatch()
  const theme        = useSelector(s => s.ui.theme)
  const page         = useSelector(s => s.ui.page)
  const { user, authLoading } = useSelector(s => s.auth)

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        dispatch(setUser({
          uid:      firebaseUser.uid,
          name:     firebaseUser.displayName || 'there',
          username: firebaseUser.email?.replace('@ct-internal.app', '') || '',
        }))
        dispatch(loadState(firebaseUser.uid))
      } else {
        dispatch(clearUser())
        dispatch(clearEntries())
        dispatch(resetGoals())
        dispatch(resetCustomFoods())
        dispatch(resetPresets())
      }
    })
    return unsub
  }, [dispatch])

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const ADMIN_UID = import.meta.env.VITE_ADMIN_UID
  const isAdmin   = user && ADMIN_UID && user.uid === ADMIN_UID

  if (authLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontSize:32 }}>
        🔥
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <div className="app-root">
      <Header />

      {/* Guest mode banner */}
      {user.isGuest && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(249,115,22,0.10))',
          borderBottom: '1px solid rgba(99,102,241,0.18)',
          textAlign: 'center',
          padding: '7px 16px',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--text-secondary)',
        }}>
          👤 Guest mode — your data is not saved and will be lost on refresh
        </div>
      )}

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        style={{
          textAlign: 'center',
          padding: '14px 16px 2px',
          fontSize: 19,
          fontWeight: 800,
          color: 'var(--text)',
          letterSpacing: '-0.3px',
        }}
      >
        {getGreeting()},{' '}
        <span style={{
          background: 'var(--brand-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {user.name}
        </span>{' '}
        <span style={{ WebkitTextFillColor: 'initial' }}>👋</span>
      </motion.div>

      <NavTabs />

      <main className="main-content">
        <AnimatePresence mode="wait">
          {page === 'dashboard' && <DashboardPage key="dashboard" />}
          {page === 'history'   && <HistoryPage   key="history" />}
          {page === 'presets'   && <PresetsPage   key="presets" />}
          {page === 'goals'     && <GoalsPage      key="goals" />}
          {page === 'admin' && isAdmin && <AdminPage key="admin" />}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
