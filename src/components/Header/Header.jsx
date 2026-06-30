import { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { toggleTheme } from '../../store/slices/uiSlice'
import { exportAllData, saveToStorage } from '../../utils/storage'
import { setEntries } from '../../store/slices/foodLogSlice'
import { loadGoals } from '../../store/slices/goalsSlice'
import { sumEntries } from '../../utils/macroCalc'
import { todayKey } from '../../utils/dateHelpers'
import toast from 'react-hot-toast'
import styles from './Header.module.css'

export default function Header() {
  const dispatch   = useDispatch()
  const theme      = useSelector(s => s.ui.theme)
  const state      = useSelector(s => s)
  const goals      = useSelector(s => s.goals)
  const todayEntries = useSelector(s => s.foodLog.entries[todayKey()] || [])
  const importRef  = useRef()

  const todayTotals = sumEntries(todayEntries)
  const calorieGoal = goals.calories

  function handleExport() {
    exportAllData(state)
    toast.success('Data exported!')
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result)
        if (d.foodLog) {
          dispatch(setEntries(d.foodLog))
          saveToStorage('cal_log', d.foodLog)
        }
        if (d.goals) {
          dispatch(loadGoals(d.goals))
          saveToStorage('cal_goals', d.goals)
        }
        toast.success('Data imported!')
      } catch {
        toast.error('Invalid backup file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoMark}>🔥 Calorie</span>
          <span className={styles.logoText}> Tracker</span>
        </div>

        {/* Today's calories pill */}
        <div className={styles.statPill}>
          <span className={styles.statIcon}>⚡</span>
          <span>
            {todayTotals.calories.toFixed(0)}
            <span className={styles.statDivider}> / </span>
            {calorieGoal} kcal
          </span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <motion.button
            className={styles.iconBtn}
            onClick={() => dispatch(toggleTheme())}
            whileTap={{ scale: 0.9 }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </motion.button>

          <motion.button
            className={styles.iconBtn}
            onClick={handleExport}
            whileTap={{ scale: 0.9 }}
            title="Export data"
          >
            📤
          </motion.button>

          <motion.label
            className={styles.iconBtn}
            whileTap={{ scale: 0.9 }}
            title="Import data"
            style={{ cursor: 'pointer' }}
          >
            📥
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleImport}
              ref={importRef}
            />
          </motion.label>
        </div>
      </div>
    </motion.header>
  )
}
