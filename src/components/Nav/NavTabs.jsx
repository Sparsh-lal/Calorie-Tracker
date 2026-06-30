import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { setPage } from '../../store/slices/uiSlice'
import styles from './NavTabs.module.css'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'history',   label: 'History',   icon: '📅' },
  { id: 'presets',   label: 'Presets',   icon: '🍱' },
  { id: 'goals',     label: 'Goals',     icon: '🎯' },
]

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID

export default function NavTabs() {
  const dispatch = useDispatch()
  const page     = useSelector(s => s.ui.page)
  const user     = useSelector(s => s.auth.user)

  const isAdmin = user && ADMIN_UID && user.uid === ADMIN_UID
  const tabs    = isAdmin ? [...TABS, { id: 'admin', label: 'Admin', icon: '🔐' }] : TABS

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {tabs.map(tab => {
          const active = tab.id === page
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${active ? styles.active : ''} ${tab.id === 'admin' ? styles.adminTab : ''}`}
              onClick={() => dispatch(setPage(tab.id))}
              aria-current={active ? 'page' : undefined}
            >
              <span className={styles.icon}>{tab.icon}</span>
              <span className={styles.label}>{tab.label}</span>
              {active && (
                <motion.span
                  className={styles.indicator}
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
