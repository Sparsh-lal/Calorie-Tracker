import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import MacroCard from '../UI/MacroCard'
import FoodLogTable from '../FoodLog/FoodLogTable'
import { sumEntries } from '../../utils/macroCalc'
import { todayKey, formatDateFull } from '../../utils/dateHelpers'
import styles from './DashboardPage.module.css'

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

export default function DashboardPage() {
  const today   = todayKey()
  const entries = useSelector(s => s.foodLog.entries[today] || [])
  const goals   = useSelector(s => s.goals)
  const totals  = sumEntries(entries)

  return (
    <motion.div
      key="dashboard"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="container section-pad">
        {/* Date heading */}
        <div className={styles.dateRow}>
          <h2 className={styles.dateHeading}>{formatDateFull(today)}</h2>
          <span className={styles.todayBadge}>Today</span>
        </div>

        {/* Macro summary cards */}
        <div className={styles.macroGrid}>
          <MacroCard
            label="Calories"
            value={totals.calories}
            goal={goals.calories}
            unit="kcal"
            colorVar="--cal"
            gradVar="--cal-grad"
            icon="🔥"
            index={0}
          />
          <MacroCard
            label="Protein"
            value={totals.protein}
            goal={goals.protein}
            unit="g"
            colorVar="--protein"
            gradVar="--protein-grad"
            icon="💪"
            index={1}
          />
          <MacroCard
            label="Carbs"
            value={totals.carbs}
            goal={goals.carbs}
            unit="g"
            colorVar="--carbs"
            gradVar="--carbs-grad"
            icon="🌾"
            index={2}
          />
          <MacroCard
            label="Fat"
            value={totals.fat}
            goal={goals.fat}
            unit="g"
            colorVar="--fat"
            gradVar="--fat-grad"
            icon="🫒"
            index={3}
          />
        </div>

        {/* Today's food log (grouped by meal) */}
        <div className={styles.logSection}>
          <FoodLogTable dateKey={today} />
        </div>
      </div>
    </motion.div>
  )
}
