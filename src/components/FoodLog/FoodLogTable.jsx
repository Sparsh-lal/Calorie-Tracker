import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { deleteEntry } from '../../store/slices/foodLogSlice'
import { sumEntries } from '../../utils/macroCalc'
import { MEAL_ICONS } from '../../utils/tdeeCalc'
import AddFoodModal from './AddFoodModal'
import toast from 'react-hot-toast'
import styles from './FoodLogTable.module.css'

function fmt(n) { return n % 1 === 0 ? String(n) : n.toFixed(1) }

function EntryRow({ entry, onEdit, onDelete }) {
  return (
    <motion.div
      className={styles.entryRow}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className={styles.colFood} title={entry.foodName}>{entry.foodName}</span>
      <span className={styles.colQty}>
        {fmt(entry.quantity)}<span className={styles.unit}>{entry.servingUnit}</span>
      </span>
      <span className={`${styles.colMacro} ${styles.cal}`}>{fmt(entry.calories)}</span>
      <span className={`${styles.colMacro} ${styles.prot}`}>{fmt(entry.protein)}g</span>
      <span className={`${styles.colMacro} ${styles.carb}`}>{fmt(entry.carbs)}g</span>
      <span className={`${styles.colMacro} ${styles.fat}`}>{fmt(entry.fat)}g</span>
      <span className={styles.colAct}>
        <button className={styles.actionBtn} onClick={() => onEdit(entry)} title="Edit">✏️</button>
        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDelete(entry.id, entry.foodName)} title="Delete">🗑️</button>
      </span>
    </motion.div>
  )
}

function MealSection({ icon, name, entries, onAdd, onEdit, onDelete }) {
  const totals = sumEntries(entries)
  return (
    <div className={styles.mealSection}>
      <div className={styles.mealHeader}>
        <span className={styles.mealIcon}>{icon}</span>
        <span className={styles.mealName}>{name}</span>
        {entries.length > 0 && (
          <div className={styles.mealTotals}>
            <span className={`${styles.mchip} ${styles.calChip}`}>{fmt(totals.calories)} kcal</span>
            <span className={`${styles.mchip} ${styles.pChip}`}>{fmt(totals.protein)}g P</span>
            <span className={`${styles.mchip} ${styles.cChip}`}>{fmt(totals.carbs)}g C</span>
            <span className={`${styles.mchip} ${styles.fChip}`}>{fmt(totals.fat)}g F</span>
          </div>
        )}
        <button className={styles.mealAddBtn} onClick={onAdd}>+ Add</button>
      </div>

      {entries.length === 0 ? (
        <div className={styles.mealEmpty}>
          <span>Nothing logged yet</span>
          <button className={styles.mealAddEmptyLink} onClick={onAdd}>+ Add food</button>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {entries.map(entry => (
            <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}

/**
 * @param {object} props
 * @param {string} props.dateKey — "YYYY-MM-DD"
 */
export default function FoodLogTable({ dateKey }) {
  const dispatch  = useDispatch()
  const entries   = useSelector(s => s.foodLog.entries[dateKey] || [])
  const meals     = useSelector(s => s.goals.meals)
  const totals    = sumEntries(entries)

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editEntry,    setEditEntry]    = useState(null)
  const [defaultMeal,  setDefaultMeal]  = useState(null)

  function openAdd(mealName) {
    setEditEntry(null)
    setDefaultMeal(mealName)
    setModalOpen(true)
  }

  function openEdit(entry) {
    setEditEntry(entry)
    setDefaultMeal(null)
    setModalOpen(true)
  }

  function handleDelete(entryId, foodName) {
    dispatch(deleteEntry({ dateKey, entryId }))
    toast.success(`${foodName} removed`)
  }

  // Group entries by stored meal name
  const grouped = {}
  meals.forEach(m => { grouped[m] = [] })
  const otherEntries = []
  entries.forEach(e => {
    if (Object.prototype.hasOwnProperty.call(grouped, e.meal)) {
      grouped[e.meal].push(e)
    } else {
      otherEntries.push(e)
    }
  })

  const hasEntries = entries.length > 0

  return (
    <>
      <div className={`card ${styles.wrap}`}>
        {/* Header with daily totals */}
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>🍽️ Food Log</h3>
          {hasEntries && (
            <div className={styles.dailySummary}>
              <span className={`${styles.dchip} ${styles.calChip}`}>{fmt(totals.calories)} kcal</span>
              <span className={`${styles.dchip} ${styles.pChip}`}>{fmt(totals.protein)}g P</span>
              <span className={`${styles.dchip} ${styles.cChip}`}>{fmt(totals.carbs)}g C</span>
              <span className={`${styles.dchip} ${styles.fChip}`}>{fmt(totals.fat)}g F</span>
            </div>
          )}
        </div>

        {/* Column headers — shown only when there are entries */}
        {hasEntries && (
          <div className={styles.colHeaders}>
            <span className={styles.colFood}>Food</span>
            <span className={styles.colQty}>Qty</span>
            <span className={`${styles.colMacro} ${styles.cal}`}>Cal</span>
            <span className={`${styles.colMacro} ${styles.prot}`}>P</span>
            <span className={`${styles.colMacro} ${styles.carb}`}>C</span>
            <span className={`${styles.colMacro} ${styles.fat}`}>F</span>
            <span className={styles.colAct}></span>
          </div>
        )}

        {/* Meal sections */}
        {meals.map((mealName, idx) => (
          <MealSection
            key={`${idx}-${mealName}`}
            icon={MEAL_ICONS[idx] || '🍽️'}
            name={mealName}
            entries={grouped[mealName] || []}
            onAdd={() => openAdd(mealName)}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}

        {/* Legacy entries (meal name renamed / pre-feature entries) */}
        {otherEntries.length > 0 && (
          <MealSection
            icon="📋"
            name="Other"
            entries={otherEntries}
            onAdd={() => openAdd(meals[0])}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Daily totals row */}
        {hasEntries && (
          <div className={styles.totalsRow}>
            <span className={styles.colFood}>
              <strong>Daily Total</strong>
              <span className={styles.itemCount}> · {entries.length} item{entries.length !== 1 ? 's' : ''}</span>
            </span>
            <span className={styles.colQty}></span>
            <span className={`${styles.colMacro} ${styles.cal} ${styles.totalVal}`}>{fmt(totals.calories)}</span>
            <span className={`${styles.colMacro} ${styles.prot} ${styles.totalVal}`}>{fmt(totals.protein)}g</span>
            <span className={`${styles.colMacro} ${styles.carb} ${styles.totalVal}`}>{fmt(totals.carbs)}g</span>
            <span className={`${styles.colMacro} ${styles.fat} ${styles.totalVal}`}>{fmt(totals.fat)}g</span>
            <span className={styles.colAct}></span>
          </div>
        )}
      </div>

      <AddFoodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dateKey={dateKey}
        editEntry={editEntry}
        defaultMeal={defaultMeal}
      />
    </>
  )
}
