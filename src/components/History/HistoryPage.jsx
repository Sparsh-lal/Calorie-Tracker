import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import MacroCard from '../UI/MacroCard'
import FoodLogTable from '../FoodLog/FoodLogTable'
import { setActiveDate } from '../../store/slices/uiSlice'
import { sumEntries, pct } from '../../utils/macroCalc'
import {
  todayKey, dateKey, shiftDay, isFutureDate, formatDateFull,
  daysInMonth, firstCellOffset, MONTHS_FULL,
} from '../../utils/dateHelpers'
import styles from './HistoryPage.module.css'

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

// ─────────────────────────────────────────────────────────────────
// Calendar cell — shows date number + 4 macro values + a calorie bar
// ─────────────────────────────────────────────────────────────────
function CalendarCell({ day, dKey, totals, goals, isActive, isToday, isFuture, onClick }) {
  const hasData  = totals.calories > 0 || totals.protein > 0 || totals.carbs > 0 || totals.fat > 0
  const calPct   = pct(totals.calories, goals.calories)
  const calOver  = goals.calories > 0 && totals.calories > goals.calories

  return (
    <motion.div
      role="button"
      tabIndex={isFuture ? -1 : 0}
      aria-pressed={isActive}
      className={[
        styles.calCell,
        isActive  ? styles.calActive  : '',
        isToday   ? styles.calToday   : '',
        isFuture  ? styles.calFuture  : '',
        !hasData && !isFuture ? styles.calNoData : '',
      ].join(' ')}
      onClick={isFuture ? undefined : onClick}
      onKeyDown={e => !isFuture && e.key === 'Enter' && onClick()}
      whileHover={!isFuture ? { y: -1, boxShadow: 'var(--shadow-md)' } : {}}
      whileTap={!isFuture ? { scale: 0.97 } : {}}
    >
      {/* Date number */}
      <div className={styles.cellTop}>
        <span className={styles.cellDayNum}>{day}</span>
        {isToday && <span className={styles.todayBadge}>Today</span>}
      </div>

      {hasData ? (
        <>
          {/* Single calorie progress bar */}
          <div className={styles.calBarTrack}>
            <motion.div
              className={styles.calBarFill}
              style={{ background: calOver ? 'var(--danger)' : 'var(--cal)' }}
              initial={{ width: 0 }}
              animate={{ width: `${calPct}%` }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>

          {/* 4 macro values */}
          <div className={styles.cellMacros}>
            <div className={`${styles.mv} ${styles.mvCal}`}
                 style={{ color: calOver ? 'var(--danger)' : 'var(--cal)' }}>
              🔥 {totals.calories % 1 === 0 ? totals.calories : totals.calories.toFixed(0)}
            </div>
            <div className={`${styles.mv} ${styles.mvP}`}>
              P&nbsp;{totals.protein % 1 === 0 ? totals.protein : totals.protein.toFixed(0)}g
            </div>
            <div className={`${styles.mv} ${styles.mvC}`}>
              C&nbsp;{totals.carbs % 1 === 0 ? totals.carbs : totals.carbs.toFixed(0)}g
            </div>
            <div className={`${styles.mv} ${styles.mvF}`}>
              F&nbsp;{totals.fat % 1 === 0 ? totals.fat : totals.fat.toFixed(0)}g
            </div>
          </div>
        </>
      ) : !isFuture ? (
        <div className={styles.noDataLabel}>—</div>
      ) : null}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const dispatch   = useDispatch()
  const activeDate = useSelector(s => s.ui.activeDate)
  const goals      = useSelector(s => s.goals)
  const allEntries = useSelector(s => s.foodLog.entries)
  const today      = todayKey()

  // Initialise calendar on the month of activeDate
  const [ady, adm] = activeDate.split('-').map(Number)
  const [calYear,  setCalYear]  = useState(ady)
  const [calMonth, setCalMonth] = useState(adm)

  // Compute totals for every day in the viewed month (memoised)
  const monthData = useMemo(() => {
    const days   = daysInMonth(calYear, calMonth)
    const result = {}
    for (let d = 1; d <= days; d++) {
      const k  = dateKey(calYear, calMonth, d)
      result[k] = sumEntries(allEntries[k] || [])
    }
    return result
  }, [allEntries, calYear, calMonth])

  // Month nav bounds — don't allow navigating past current month
  const [ty, tm] = today.split('-').map(Number)
  const atMaxMonth = calYear > ty || (calYear === ty && calMonth >= tm)

  function prevMonth() {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (atMaxMonth) return
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1) }
    else setCalMonth(m => m + 1)
  }
  function goTo(key) {
    dispatch(setActiveDate(key))
  }
  function jumpToToday() {
    goTo(today)
    setCalYear(ty)
    setCalMonth(tm)
  }

  // Build cell array (offset + days + right-padding to fill last row)
  const offset    = firstCellOffset(calYear, calMonth)
  const totalDays = daysInMonth(calYear, calMonth)
  const cells     = [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  // Day detail state
  const dayEntries = allEntries[activeDate] || []
  const dayTotals  = sumEntries(dayEntries)
  const isFuture   = isFutureDate(activeDate)
  const isToday    = activeDate === today

  return (
    <motion.div
      key="history"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="container section-pad">

        {/* ── Month navigation ── */}
        <div className={styles.monthNav}>
          <motion.button
            className={`btn btn-outline ${styles.monthNavBtn}`}
            onClick={prevMonth}
            whileTap={{ scale: 0.95 }}
          >
            ← Prev
          </motion.button>

          <h2 className={styles.monthTitle}>
            {MONTHS_FULL[calMonth - 1]}&nbsp;{calYear}
          </h2>

          <motion.button
            className={`btn btn-outline ${styles.monthNavBtn}`}
            onClick={nextMonth}
            disabled={atMaxMonth}
            whileTap={{ scale: 0.95 }}
          >
            Next →
          </motion.button>

          {!isToday && (
            <button className="btn btn-ghost" onClick={jumpToToday}>
              ↩ Today
            </button>
          )}
        </div>

        {/* ── Calendar grid ── */}
        <div className={`card ${styles.calWrap}`}>
          {/* Day-of-week header row */}
          <div className={styles.dowRow}>
            {DOW_LABELS.map(d => (
              <div key={d} className={styles.dowCell}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className={styles.calGrid}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`g${idx}`} className={styles.calGhost} />
              const k = dateKey(calYear, calMonth, day)
              return (
                <CalendarCell
                  key={k}
                  day={day}
                  dKey={k}
                  totals={monthData[k]}
                  goals={goals}
                  isActive={k === activeDate}
                  isToday={k === today}
                  isFuture={k > today}
                  onClick={() => goTo(k)}
                />
              )
            })}
          </div>
        </div>

        {/* ── Day detail ── */}
        <div className={styles.dayDetail}>
          <div className={styles.dayDetailNav}>
            <motion.button
              className="btn btn-ghost"
              onClick={() => goTo(shiftDay(activeDate, -1))}
              whileTap={{ scale: 0.95 }}
            >
              ← Prev day
            </motion.button>

            <h3 className={styles.dayDetailTitle}>{formatDateFull(activeDate)}</h3>

            <motion.button
              className="btn btn-ghost"
              onClick={() => goTo(shiftDay(activeDate, 1))}
              disabled={isToday || isFuture}
              whileTap={{ scale: 0.95 }}
            >
              Next day →
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {isFuture ? (
              <motion.div
                key="future"
                className={styles.futureMsg}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <span>🔮</span><span>No data for future dates</span>
              </motion.div>
            ) : (
              <motion.div
                key={activeDate}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                <div className={styles.macroGrid}>
                  <MacroCard label="Calories" value={dayTotals.calories} goal={goals.calories} unit="kcal" colorVar="--cal"     gradVar="--cal-grad"     icon="🔥" index={0} />
                  <MacroCard label="Protein"  value={dayTotals.protein}  goal={goals.protein}  unit="g"    colorVar="--protein" gradVar="--protein-grad" icon="💪" index={1} />
                  <MacroCard label="Carbs"    value={dayTotals.carbs}    goal={goals.carbs}    unit="g"    colorVar="--carbs"   gradVar="--carbs-grad"   icon="🌾" index={2} />
                  <MacroCard label="Fat"      value={dayTotals.fat}      goal={goals.fat}      unit="g"    colorVar="--fat"     gradVar="--fat-grad"     icon="🫒" index={3} />
                </div>
                <FoodLogTable dateKey={activeDate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  )
}
