import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AnimatePresence } from 'framer-motion'
import Header from './components/Header/Header'
import NavTabs from './components/Nav/NavTabs'
import DashboardPage from './components/Dashboard/DashboardPage'
import HistoryPage from './components/History/HistoryPage'
import GoalsPage from './components/Goals/GoalsPage'
import { loadState } from './store/slices/persistSlice'

function App() {
  const dispatch = useDispatch()
  const theme    = useSelector(s => s.ui.theme)
  const page     = useSelector(s => s.ui.page)

  // Hydrate Redux from localStorage on first mount
  useEffect(() => {
    dispatch(loadState())
  }, [dispatch])

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="app-root">
      <Header />
      <NavTabs />

      <main className="main-content">
        <AnimatePresence mode="wait">
          {page === 'dashboard' && <DashboardPage key="dashboard" />}
          {page === 'history'   && <HistoryPage   key="history" />}
          {page === 'goals'     && <GoalsPage      key="goals" />}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
