import { motion } from 'framer-motion'
import styles from './MacroCard.module.css'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: i => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  }),
}

/**
 * @param {object}  props
 * @param {string}  props.label     — "Calories" | "Protein" | "Carbs" | "Fat"
 * @param {number}  props.value     — consumed today
 * @param {number}  props.goal      — daily target
 * @param {string}  props.unit      — "kcal" | "g"
 * @param {string}  props.colorVar  — CSS variable name, e.g. "--cal"
 * @param {string}  props.gradVar   — CSS variable name for gradient, e.g. "--cal-grad"
 * @param {string}  props.icon      — emoji
 * @param {number}  props.index     — stagger index
 */
export default function MacroCard({ label, value, goal, unit, colorVar, gradVar, icon, index = 0 }) {
  const pct  = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  const over = value > goal && goal > 0

  return (
    <motion.div
      className={styles.card}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
    >
      <div className={styles.top}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </div>

      <div
        className={styles.value}
        style={{ color: over ? 'var(--danger)' : `var(${colorVar})` }}
      >
        {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
        <span className={styles.unit}>{unit}</span>
      </div>

      {/* Progress bar */}
      <div className={styles.track}>
        <motion.div
          className={styles.fill}
          style={{
            background: over ? 'var(--danger)' : `var(${gradVar})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.15 + index * 0.07 }}
        />
      </div>

      <div className={styles.ratio}>
        <span style={{ color: over ? 'var(--danger)' : 'var(--text)' }}>
          {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
        </span>
        <span className={styles.sep}> / </span>
        <span className={styles.goalVal}>{goal} {unit}</span>
        {over && <span className={styles.overTag}>over</span>}
      </div>
    </motion.div>
  )
}
