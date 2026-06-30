import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { addPreset, updatePreset, deletePreset } from '../../store/slices/presetsSlice'
import { addCustomFood } from '../../store/slices/customFoodsSlice'
import { addEntry } from '../../store/slices/foodLogSlice'
import { scaleMacros, sumEntries } from '../../utils/macroCalc'
import { todayKey } from '../../utils/dateHelpers'
import { MEAL_ICONS } from '../../utils/tdeeCalc'
import builtinFoods from '../../data/foods.json'
import toast from 'react-hot-toast'
import styles from './PresetsPage.module.css'

const CATEGORY_ICONS = {
  protein: '🥩', dairy: '🥛', grains: '🌾', fruits: '🍎',
  vegetables: '🥦', fats: '🥑', snacks: '🍫', beverages: '☕',
  supplements: '💊', custom: '⭐',
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.2 } },
}

const BLANK_PRESET = { name: '', items: [] }

export default function PresetsPage() {
  const dispatch    = useDispatch()
  const presets     = useSelector(s => s.presets.presets)
  const customFoods = useSelector(s => s.customFoods.foods)
  const meals       = useSelector(s => s.goals.meals)

  const allFoods = useMemo(() => [
    ...builtinFoods,
    ...customFoods.map(f => ({ ...f, category: 'custom' }))
  ], [customFoods])

  // Editor modal state
  const [editing,     setEditing]     = useState(null)   // null | { id?, name, items[] }
  const [presetName,  setPresetName]  = useState('')
  const [items,       setItems]       = useState([])     // { foodId, foodName, servingSize, servingUnit, quantity, calories, protein, carbs, fat }

  // Food search inside editor
  const [searchQ,    setSearchQ]    = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Create custom food inside editor
  const [showCF, setShowCF] = useState(false)
  const [cf, setCf] = useState({ name: '', servingUnit: 'serving', calories: '', protein: '', carbs: '', fat: '' })

  // Apply modal state
  const [applyPreset, setApplyPreset] = useState(null)  // preset object
  const [applyDate,   setApplyDate]   = useState(todayKey())
  const [applyMeal,   setApplyMeal]   = useState(null)

  // ── Editor helpers ─────────────────────────────────────────────────────────

  function openNew() {
    setEditing(BLANK_PRESET)
    setPresetName('')
    setItems([])
    setSearchQ('')
    setShowSearch(false)
    setShowCF(false)
  }

  function openEdit(preset) {
    setEditing(preset)
    setPresetName(preset.name)
    setItems(preset.items.map(i => ({ ...i })))
    setSearchQ('')
    setShowSearch(false)
    setShowCF(false)
  }

  function closeEditor() { setEditing(null) }

  function addItemToPreset(food) {
    setItems(prev => [
      ...prev,
      {
        foodId:      food.id,
        foodName:    food.name,
        category:    food.category,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        quantity:    1,
        calories:    food.calories,
        protein:     food.protein,
        carbs:       food.carbs,
        fat:         food.fat,
      }
    ])
    setSearchQ('')
    setShowSearch(false)
  }

  function updateItemQty(idx, qty) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const base = allFoods.find(f => f.id === item.foodId)
      if (!base) return { ...item, quantity: qty }
      const macros = scaleMacros(base, qty)
      return { ...item, quantity: qty, ...macros }
    }))
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
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
    setCf({ name: '', servingUnit: 'serving', calories: '', protein: '', carbs: '', fat: '' })
    setShowCF(false)
    addItemToPreset(newFood)
  }

  function handleSavePreset() {
    const name = presetName.trim()
    if (!name) { toast.error('Give your preset a name'); return }
    if (items.length === 0) { toast.error('Add at least one food'); return }

    if (editing.id) {
      dispatch(updatePreset({ id: editing.id, changes: { name, items } }))
      toast.success('Preset updated')
    } else {
      dispatch(addPreset({ id: crypto.randomUUID(), name, items }))
      toast.success(`"${name}" preset saved`)
    }
    closeEditor()
  }

  function handleDeletePreset(id) {
    dispatch(deletePreset(id))
    toast.success('Preset deleted')
  }

  // ── Apply helpers ──────────────────────────────────────────────────────────

  function openApply(preset) {
    setApplyPreset(preset)
    setApplyDate(todayKey())
    setApplyMeal(meals[0])
  }

  function closeApply() { setApplyPreset(null) }

  function handleApply() {
    if (!applyMeal) return
    applyPreset.items.forEach(item => {
      dispatch(addEntry({
        dateKey: applyDate,
        entry: {
          id:          crypto.randomUUID(),
          foodId:      item.foodId,
          foodName:    item.foodName,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
          quantity:    item.quantity,
          meal:        applyMeal,
          calories:    item.calories,
          protein:     item.protein,
          carbs:       item.carbs,
          fat:         item.fat,
        }
      }))
    })
    toast.success(`"${applyPreset.name}" logged to ${applyMeal}`)
    closeApply()
  }

  // ── Food search results ────────────────────────────────────────────────────
  const filteredFoods = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    if (!q) return allFoods.slice(0, 20)
    return allFoods.filter(f => f.name.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q))
  }, [searchQ, allFoods])

  // ── Preset totals ──────────────────────────────────────────────────────────
  function presetTotals(preset) {
    return preset.items.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein:  acc.protein  + (item.protein  || 0),
      carbs:    acc.carbs    + (item.carbs     || 0),
      fat:      acc.fat      + (item.fat       || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const editorTotals = useMemo(() => items.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein:  acc.protein  + (item.protein  || 0),
    carbs:    acc.carbs    + (item.carbs     || 0),
    fat:      acc.fat      + (item.fat       || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [items])

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className={styles.page}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>🍱 Meal Presets</h2>
          <p className={styles.subtitle}>Save a set of foods to log in one tap</p>
        </div>
        <motion.button
          className="btn btn-brand"
          onClick={openNew}
          whileTap={{ scale: 0.96 }}
        >
          + New Preset
        </motion.button>
      </div>

      {presets.length === 0 && (
        <div className={styles.empty}>
          <p>No presets yet.</p>
          <p>Create your first preset to quickly log your usual meals.</p>
        </div>
      )}

      <div className={styles.grid}>
        {presets.map(preset => {
          const t = presetTotals(preset)
          return (
            <div key={preset.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardName}>{preset.name}</span>
                <span className={styles.cardCount}>{preset.items.length} food{preset.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className={styles.cardMacros}>
                <span className={styles.chip} data-type="cal">{Math.round(t.calories)} kcal</span>
                <span className={styles.chip} data-type="p">{Math.round(t.protein)}g P</span>
                <span className={styles.chip} data-type="c">{Math.round(t.carbs)}g C</span>
                <span className={styles.chip} data-type="f">{Math.round(t.fat)}g F</span>
              </div>
              <ul className={styles.itemList}>
                {preset.items.map((item, i) => (
                  <li key={i} className={styles.itemRow}>
                    <span className={styles.itemIcon}>{CATEGORY_ICONS[item.category] || '🍽️'}</span>
                    <span className={styles.itemName}>{item.foodName}</span>
                    <span className={styles.itemQty}>{item.quantity}×</span>
                  </li>
                ))}
              </ul>
              <div className={styles.cardActions}>
                <button className="btn btn-ghost" onClick={() => openEdit(preset)}>✏️ Edit</button>
                <button className="btn btn-ghost" style={{ color: 'var(--danger, #ef4444)' }} onClick={() => handleDeletePreset(preset.id)}>🗑️</button>
                <motion.button className="btn btn-brand" whileTap={{ scale: 0.96 }} onClick={() => openApply(preset)}>
                  Log this ▶
                </motion.button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Editor Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) closeEditor() }}>
            <motion.div className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{    opacity: 0, scale: 0.95, y: 24 }}
              transition={{ duration: 0.22 }}>

              <div className={styles.modalHeader}>
                <h3>{editing.id ? 'Edit Preset' : 'New Preset'}</h3>
                <button className={styles.closeBtn} onClick={closeEditor}>✕</button>
              </div>

              <div className={styles.modalBody}>
                {/* Name */}
                <input
                  className={`input ${styles.nameInput}`}
                  placeholder="Preset name (e.g. Post-Workout)"
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                />

                {/* Item list */}
                {items.length > 0 && (
                  <div className={styles.editorItems}>
                    {items.map((item, idx) => (
                      <div key={idx} className={styles.editorItem}>
                        <span className={styles.itemIcon}>{CATEGORY_ICONS[item.category] || '🍽️'}</span>
                        <span className={styles.editorItemName}>{item.foodName}</span>
                        <input
                          type="number" min="0.5" step="0.5"
                          className={`input ${styles.qtyInput}`}
                          value={item.quantity}
                          onChange={e => updateItemQty(idx, parseFloat(e.target.value) || 1)}
                        />
                        <span className={styles.editorItemUnit}>{item.servingUnit}</span>
                        <button className={styles.removeBtn} onClick={() => removeItem(idx)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                {items.length > 0 && (
                  <div className={styles.editorTotals}>
                    <span data-type="cal">{Math.round(editorTotals.calories)} kcal</span>
                    <span data-type="p">{Math.round(editorTotals.protein)}g P</span>
                    <span data-type="c">{Math.round(editorTotals.carbs)}g C</span>
                    <span data-type="f">{Math.round(editorTotals.fat)}g F</span>
                  </div>
                )}

                {/* Food search */}
                {!showCF && (
                  <div className={styles.searchSection}>
                    <div className={styles.searchWrap}>
                      <input
                        className={`input ${styles.searchInput}`}
                        placeholder="🔍 Add food to preset…"
                        value={searchQ}
                        onFocus={() => setShowSearch(true)}
                        onChange={e => { setSearchQ(e.target.value); setShowSearch(true) }}
                      />
                    </div>
                    {showSearch && (
                      <div className={styles.foodDropdown}>
                        {filteredFoods.map(food => (
                          <button key={food.id} className={styles.foodRow} onClick={() => addItemToPreset(food)}>
                            <span>{CATEGORY_ICONS[food.category] || '🍽️'}</span>
                            <span className={styles.foodName}>{food.name}</span>
                            <span className={styles.foodMeta}>{food.servingSize}{food.servingUnit}</span>
                            <span className={styles.calBadge}>{food.calories} kcal</span>
                          </button>
                        ))}
                        <button className={styles.createBtn} onClick={() => { setShowCF(true); setShowSearch(false) }}>
                          ➕ Create custom food
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Create custom food inline */}
                {showCF && (
                  <div className={styles.cfForm}>
                    <div className={styles.cfRow}>
                      <label className={styles.cfLabel}>Food name</label>
                      <input className="input" placeholder="e.g. Collagen Water" value={cf.name}
                        onChange={e => setCf(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className={styles.cfRow}>
                      <label className={styles.cfLabel}>Serving unit</label>
                      <input className="input" placeholder="e.g. serving, glass, scoop" value={cf.servingUnit}
                        onChange={e => setCf(p => ({ ...p, servingUnit: e.target.value }))} />
                    </div>
                    <div className={styles.cfGrid}>
                      {[['calories','Calories (kcal)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([k, lbl]) => (
                        <div key={k} className={styles.cfCell}>
                          <label className={styles.cfLabel}>{lbl}</label>
                          <input className="input" type="number" min="0" placeholder="0"
                            value={cf[k]} onChange={e => setCf(p => ({ ...p, [k]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    <div className={styles.cfActions}>
                      <button className="btn btn-ghost" onClick={() => setShowCF(false)}>Cancel</button>
                      <motion.button className="btn btn-brand" onClick={handleSaveCustomFood} whileTap={{ scale: 0.97 }}>
                        Save &amp; Add
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button className="btn btn-ghost" onClick={closeEditor}>Cancel</button>
                <motion.button className="btn btn-brand" onClick={handleSavePreset} whileTap={{ scale: 0.97 }}>
                  Save Preset
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Apply Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {applyPreset && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) closeApply() }}>
            <motion.div className={`${styles.modal} ${styles.applyModal}`}
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{    opacity: 0, scale: 0.95, y: 24 }}
              transition={{ duration: 0.22 }}>

              <div className={styles.modalHeader}>
                <h3>Log "{applyPreset.name}"</h3>
                <button className={styles.closeBtn} onClick={closeApply}>✕</button>
              </div>

              <div className={styles.applyBody}>
                <label className={styles.applyLabel}>Date</label>
                <input
                  type="date"
                  className={`input ${styles.applyDate}`}
                  value={applyDate}
                  onChange={e => setApplyDate(e.target.value)}
                />

                <label className={styles.applyLabel}>Meal</label>
                <div className={styles.mealPills}>
                  {meals.map(meal => (
                    <button
                      key={meal}
                      className={`${styles.mealPill} ${applyMeal === meal ? styles.mealPillActive : ''}`}
                      onClick={() => setApplyMeal(meal)}
                    >
                      {MEAL_ICONS[meal] || '🍽️'} {meal}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button className="btn btn-ghost" onClick={closeApply}>Cancel</button>
                <motion.button className="btn btn-brand" onClick={handleApply} whileTap={{ scale: 0.97 }}
                  disabled={!applyMeal}>
                  Log {applyPreset.items.length} item{applyPreset.items.length !== 1 ? 's' : ''}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
