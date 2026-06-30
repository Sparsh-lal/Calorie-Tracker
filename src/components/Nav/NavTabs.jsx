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

export default function NavTabs() {
  const dispatch = useDispatch()
  const page     = useSelector(s => s.ui.page)

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {TABS.map(tab => {
          const active = tab.id === page
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${active ? styles.active : ''}`}
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
