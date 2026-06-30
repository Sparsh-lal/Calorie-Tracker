import { useState, useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { addEntry, updateEntry } from '../../store/slices/foodLogSlice'
import { addCustomFood } from '../../store/slices/customFoodsSlice'
import { scaleMacros } from '../../utils/macroCalc'
import { MEAL_ICONS } from '../../utils/tdeeCalc'
import builtinFoods from '../../data/foods.json'
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
  const dispatch     = useDispatch()
  const meals        = useSelector(s => s.goals.meals)
  const customFoods  = useSelector(s => s.customFoods.foods)
  const overrides    = useSelector(s => s.globalFoods.overrides)
  const searchRef    = useRef()
  const qtyRef       = useRef()

  // Merge builtin (with global overrides) + per-user custom foods
  const allFoods = useMemo(() => [
    ...builtinFoods.map(f => overrides[f.id] ? { ...f, ...overrides[f.id] } : f),
    ...customFoods.map(f => ({ ...f, category: 'custom' }))
  ], [customFoods, overrides])

  const [query,        setQuery]        = useState('')
  const [selected,     setSelected]     = useState(null)
  const [quantity,     setQuantity]     = useState('')
  const [selectedMeal, setSelectedMeal] = useState(null)
  // 'search' | 'create-custom'
  const [subMode,      setSubMode]      = useState('search')

  // Create-custom-food form state
  const [cf, setCf] = useState({ name: '', servingUnit: 'serving', calories: '', protein: '', carbs: '', fat: '' })

  // Hydrate modal state on open
  useEffect(() => {
    if (!isOpen) return
    setSubMode('search')
    setCf({ name: '', servingUnit: 'serving', calories: '', protein: '', carbs: '', fat: '' })
    if (editEntry) {
      const food = allFoods.find(f => f.id === editEntry.foodId)
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
    if (!q) return allFoods
    return allFoods.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    )
  }, [query, allFoods])

  const qty      = parseFloat(quantity) || 0
  const computed = selected && qty > 0 ? scaleMacros(selected, qty) : null

  function handleSelectFood(food) {
    setSelected(food)
    setQuery(food.name)
  }

  function handleSaveCustomFood() {
    const name = cf.name.trim()
    if (!name || !cf.calories || !cf.protein || !cf.carbs || !cf.fat) {
      toast.error('Fill in all 5 fields')
      return
    }
    const newFood = {
      id:          `custom-${crypto.randomUUID()}`,
      name,
      category:    'custom',
      servingSize: 1,
      servingUnit: cf.servingUnit.trim() || 'serving',
      calories:    parseFloat(cf.calories),
      protein:     parseFloat(cf.protein),
      carbs:       parseFloat(cf.carbs),
      fat:         parseFloat(cf.fat),
    }
    dispatch(addCustomFood(newFood))
    toast.success(`"${name}" saved to your foods`)
    setSubMode('search')
    setQuery(name)
    setSelected(newFood)
    setQuantity('1')
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
              {subMode === 'search' && (
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
              )}

              {/* ── Create custom food form ── */}
              {subMode === 'create-custom' && (
                <div className={styles.customForm}>
                  <div className={styles.customFormRow}>
                    <label className={styles.customLabel}>Food name</label>
                    <input className="input" placeholder="e.g. Collagen Water" value={cf.name}
                      onChange={e => setCf(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className={styles.customFormRow}>
                    <label className={styles.customLabel}>Serving unit</label>
                    <input className="input" placeholder="e.g. serving, glass, scoop" value={cf.servingUnit}
                      onChange={e => setCf(p => ({ ...p, servingUnit: e.target.value }))} />
                  </div>
                  <div className={styles.customFormGrid}>
                    {[['calories','Calories (kcal)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([k, lbl]) => (
                      <div key={k} className={styles.customFormCell}>
                        <label className={styles.customLabel}>{lbl}</label>
                        <input className="input" type="number" min="0" placeholder="0"
                          value={cf[k]} onChange={e => setCf(p => ({ ...p, [k]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <div className={styles.customFormActions}>
                    <button className="btn btn-ghost" onClick={() => setSubMode('search')}>Cancel</button>
                    <motion.button className="btn btn-brand" onClick={handleSaveCustomFood}
                      whileTap={{ scale: 0.97 }}>Save &amp; Add</motion.button>
                  </div>
                </div>
              )}

              {/* Food list — hidden once a food is selected */}
              {subMode === 'search' && !selected && (
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
                  <button className={styles.createCustomBtn} onClick={() => setSubMode('create-custom')}>
                    ➕ Create custom food
                  </button>
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
