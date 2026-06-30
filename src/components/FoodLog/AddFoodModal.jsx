import { useState, useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { addEntry, updateEntry } from '../../store/slices/foodLogSlice'
import { scaleMacros } from '../../utils/macroCalc'
import { MEAL_ICONS } from '../../utils/tdeeCalc'
import foods from '../../data/foods.json'
import toast from 'react-hot-toast'
import styles from './AddFoodModal.module.css'

const CATEGORY_ICONS = {
  protein:   '🥩',
  grain:     '🌾',
  vegetable: '🥦',
  fruit:     '🍎',
  dairy:     '🥛',
  fat:       '🫒',
  snack:     '🥜',
  beverage:  '☕',
}

/**
 * @param {object}  props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string}  props.dateKey
 * @param {object|null} props.editEntry   — non-null when editing an existing entry
 * @param {string|null} props.defaultMeal  — meal name to pre-select when adding
 */
export default function AddFoodModal({ isOpen, onClose, dateKey, editEntry = null, defaultMeal = null }) {
  const dispatch   = useDispatch()
  const meals      = useSelector(s => s.goals.meals)
  const searchRef  = useRef()
  const qtyRef     = useRef()

  const [query,        setQuery]        = useState('')
  const [selected,     setSelected]     = useState(null)
  const [quantity,     setQuantity]     = useState('')
  const [selectedMeal, setSelectedMeal] = useState(null)

  // Hydrate modal state on open
  useEffect(() => {
    if (!isOpen) return
    if (editEntry) {
      const food = foods.find(f => f.id === editEntry.foodId)
      setSelected(food || null)
      setQuantity(String(editEntry.quantity))
      setQuery(food ? food.name : '')
      setSelectedMeal(editEntry.meal || defaultMeal || meals[0])
    } else {
      setQuery('')
      setSelected(null)
      setQuantity('')
      setSelectedMeal(defaultMeal || meals[0])
    }
  }, [isOpen, editEntry, defaultMeal, meals])

  // Focus search on open (add mode)
  useEffect(() => {
    if (isOpen && !editEntry) setTimeout(() => searchRef.current?.focus(), 80)
  }, [isOpen, editEntry])

  // Pre-fill quantity when food selected (add mode)
  useEffect(() => {
    if (selected && !editEntry) {
      setQuantity(String(selected.servingSize))
      setTimeout(() => qtyRef.current?.focus(), 50)
    }
  }, [selected, editEntry])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods
    return foods.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    )
  }, [query])

  const qty      = parseFloat(quantity) || 0
  const computed = selected && qty > 0 ? scaleMacros(selected, qty) : null

  function handleSelectFood(food) {
    setSelected(food)
    setQuery(food.name)
  }

  function handleSubmit() {
    if (!selected || qty <= 0 || !selectedMeal) return
    const macros = scaleMacros(selected, qty)

    if (editEntry) {
      dispatch(updateEntry({
        dateKey,
        entryId: editEntry.id,
        updates: {
          foodId:      selected.id,
          foodName:    selected.name,
          servingSize: selected.servingSize,
          servingUnit: selected.servingUnit,
          quantity:    qty,
          meal:        selectedMeal,
          ...macros,
        },
      }))
      toast.success('Entry updated')
    } else {
      dispatch(addEntry({
        dateKey,
        entry: {
          id:          crypto.randomUUID(),
          foodId:      selected.id,
          foodName:    selected.name,
          servingSize: selected.servingSize,
          servingUnit: selected.servingUnit,
          quantity:    qty,
          meal:        selectedMeal,
          ...macros,
        },
      }))
      toast.success(`Added to ${selectedMeal}`)
    }
    onClose()
  }

  const canSubmit = selected && qty > 0 && selectedMeal

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <h2 className={styles.title}>
                {editEntry ? '✏️ Edit Food Entry' : '➕ Add Food'}
              </h2>
              <button className={`btn btn-ghost btn-icon`} onClick={onClose} title="Close">✕</button>
            </div>

            <div className={styles.body}>
              {/* ── Meal selector ── */}
              <div className={styles.mealSelectorWrap}>
                <span className={styles.mealSelectorLabel}>Meal</span>
                <div className={styles.mealSelector}>
                  {meals.map((mealName, idx) => (
                    <button
                      key={idx}
                      className={`${styles.mealPill} ${selectedMeal === mealName ? styles.mealActive : ''}`}
                      onClick={() => setSelectedMeal(mealName)}
                    >
                      <span>{MEAL_ICONS[idx] || '🍽️'}</span>
                      <span>{mealName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Search ── */}
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  ref={searchRef}
                  className={`input ${styles.searchInput}`}
                  type="text"
                  placeholder="Search food…"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value)
                    if (selected && e.target.value !== selected.name) setSelected(null)
                  }}
                />
                {query && (
                  <button
                    className={styles.clearBtn}
                    onClick={() => { setQuery(''); setSelected(null); searchRef.current?.focus() }}
                  >✕</button>
                )}
              </div>

              {/* Food list — hidden once a food is selected */}
              {!selected && (
                <div className={styles.foodList}>
                  {filtered.length === 0 && (
                    <div className={styles.empty}>No foods found for "{query}"</div>
                  )}
                  {filtered.map(food => (
                    <button
                      key={food.id}
                      className={styles.foodRow}
                      onClick={() => handleSelectFood(food)}
                    >
                      <span className={styles.foodIcon}>
                        {CATEGORY_ICONS[food.category] || '🍽️'}
                      </span>
                      <span className={styles.foodName}>{food.name}</span>
                      <span className={styles.foodMeta}>
                        {food.servingSize}{food.servingUnit}
                      </span>
                      <div className={styles.foodMacros}>
                        <span className={styles.macroChip} data-type="cal">{food.calories} kcal</span>
                        <span className={styles.macroChip} data-type="p">{food.protein}g P</span>
                        <span className={styles.macroChip} data-type="c">{food.carbs}g C</span>
                        <span className={styles.macroChip} data-type="f">{food.fat}g F</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Quantity + preview panel */}
              {selected && (
                <motion.div
                  className={styles.panel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={styles.selectedFood}>
                    <span className={styles.foodIconLg}>
                      {CATEGORY_ICONS[selected.category] || '🍽️'}
                    </span>
                    <div>
                      <div className={styles.selectedName}>{selected.name}</div>
                      <div className={styles.selectedBase}>
                        Per {selected.servingSize}{selected.servingUnit}: {selected.calories} kcal ·{' '}
                        {selected.protein}g P · {selected.carbs}g C · {selected.fat}g F
                      </div>
                    </div>
                    <button
                      className={styles.changeBtn}
                      onClick={() => { setSelected(null); setQuantity(''); setQuery('') }}
                    >
                      Change
                    </button>
                  </div>

                  <div className={styles.qtyRow}>
                    <label className={styles.qtyLabel}>Quantity ({selected.servingUnit})</label>
                    <input
                      ref={qtyRef}
                      className={`input ${styles.qtyInput}`}
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder={`e.g. ${selected.servingSize}`}
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
                    />
                  </div>

                  {computed && (
                    <div className={styles.preview}>
                      <div className={styles.previewRow}>
                        <div className={`${styles.previewCell} ${styles.calCell}`}>
                          <div className={styles.previewVal}>{computed.calories}</div>
                          <div className={styles.previewLbl}>kcal</div>
                        </div>
                        <div className={`${styles.previewCell} ${styles.pCell}`}>
                          <div className={styles.previewVal}>{computed.protein}g</div>
                          <div className={styles.previewLbl}>Protein</div>
                        </div>
                        <div className={`${styles.previewCell} ${styles.cCell}`}>
                          <div className={styles.previewVal}>{computed.carbs}g</div>
                          <div className={styles.previewLbl}>Carbs</div>
                        </div>
                        <div className={`${styles.previewCell} ${styles.fCell}`}>
                          <div className={styles.previewVal}>{computed.fat}g</div>
                          <div className={styles.previewLbl}>Fat</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
              <motion.button
                className="btn btn-brand"
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={{ scale: canSubmit ? 1.03 : 1 }}
                whileTap={{ scale: canSubmit ? 0.97 : 1 }}
              >
                {editEntry
                  ? '✓ Update Entry'
                  : `+ Add to ${selectedMeal || '…'}`}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
