import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { upsertOverride, removeOverride } from '../../store/slices/globalFoodsSlice'
import { saveGlobalFood, deleteGlobalFoodOverride } from '../../utils/firestore'
import builtinFoods from '../../data/foods.json'
import toast from 'react-hot-toast'
import styles from './AdminPage.module.css'

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID

const CATEGORY_ICONS = {
  protein: '🥩', dairy: '🥛', grains: '🌾', fruits: '🍎',
  vegetables: '🥦', fats: '🥑', snacks: '🍫', beverages: '☕',
  supplements: '💊',
}

const CATEGORIES = ['protein','dairy','grains','fruits','vegetables','fats','snacks','beverages','supplements']

const MACRO_FIELDS = [
  { key: 'calories', label: 'Calories (kcal)', color: '--cal'     },
  { key: 'protein',  label: 'Protein (g)',     color: '--protein' },
  { key: 'carbs',    label: 'Carbs (g)',        color: '--carbs'   },
  { key: 'fat',      label: 'Fat (g)',          color: '--fat'     },
]

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.2 } },
}

export default function AdminPage() {
  const dispatch  = useDispatch()
  const user      = useSelector(s => s.auth.user)
  const overrides = useSelector(s => s.globalFoods.overrides)

  const [search,  setSearch]  = useState('')
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  // Double-check auth in component (Firestore rules are the real lock)
  if (!user || (ADMIN_UID && user.uid !== ADMIN_UID)) {
    return (
      <div className={styles.noAuth}>
        <span>🔒</span>
        <p>Not authorized</p>
      </div>
    )
  }

  const foods = useMemo(() => {
    const q = search.trim().toLowerCase()
    return builtinFoods
      .map(f => overrides[f.id] ? { ...f, ...overrides[f.id], _edited: true } : f)
      .filter(f => {
        const matchQ   = !q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
        const matchCat = catFilter === 'all' || f.category === catFilter
        return matchQ && matchCat
      })
  }, [search, catFilter, overrides])

  const editedCount = Object.keys(overrides).length

  function openEdit(food) {
    setEditing(food)
    setForm({
      name:        food.name,
      category:    food.category,
      servingSize: String(food.servingSize),
      servingUnit: food.servingUnit,
      calories:    String(food.calories),
      protein:     String(food.protein),
      carbs:       String(food.carbs),
      fat:         String(food.fat),
    })
  }

  function closeEdit() { setEditing(null) }

  async function handleSave() {
    const name = form.name.trim()
    if (!name) { toast.error('Name required'); return }
    setSaving(true)
    try {
      const updated = {
        id:          editing.id,
        name,
        category:    form.category.trim() || editing.category,
        servingSize: parseFloat(form.servingSize) || editing.servingSize,
        servingUnit: form.servingUnit.trim() || editing.servingUnit,
        calories:    parseFloat(form.calories) || 0,
        protein:     parseFloat(form.protein)  || 0,
        carbs:       parseFloat(form.carbs)    || 0,
        fat:         parseFloat(form.fat)      || 0,
      }
      await saveGlobalFood(updated)
      dispatch(upsertOverride(updated))
      toast.success(`"${updated.name}" updated globally ✓`)
      closeEdit()
    } catch (e) {
      toast.error('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleReset(food, e) {
    e.stopPropagation()
    try {
      await deleteGlobalFoodOverride(food.id)
      dispatch(removeOverride(food.id))
      toast.success(`"${food.name}" reset to defaults`)
    } catch (e) {
      toast.error('Reset failed: ' + e.message)
    }
  }

  return (
    <motion.div
      className={styles.page}
      variants={pageVariants}
      initial="initial" animate="animate" exit="exit"
    >
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>🔐 Food Database</h2>
          <p className={styles.subtitle}>
            Changes apply globally — all users see updated values immediately
          </p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statChip} data-type="edited">{editedCount} edited</div>
          <div className={styles.statChip}>{builtinFoods.length} total</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          className={`input ${styles.search}`}
          placeholder="🔍 Search by name or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.catPills}>
          <button
            className={`${styles.catPill} ${catFilter === 'all' ? styles.catPillActive : ''}`}
            onClick={() => setCatFilter('all')}
          >All</button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.catPill} ${catFilter === cat ? styles.catPillActive : ''}`}
              onClick={() => setCatFilter(cat)}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <span className={styles.colFood}>Food</span>
          <span className={styles.colNum}>Serving</span>
          <span className={styles.colNum} data-type="cal">Kcal</span>
          <span className={styles.colNum} data-type="p">Protein</span>
          <span className={styles.colNum} data-type="c">Carbs</span>
          <span className={styles.colNum} data-type="f">Fat</span>
          <span className={styles.colAct}></span>
        </div>

        {foods.map(food => (
          <div
            key={food.id}
            className={`${styles.row} ${food._edited ? styles.rowEdited : ''}`}
          >
            <span className={styles.colFood}>
              <span className={styles.foodIcon}>{CATEGORY_ICONS[food.category] || '🍽️'}</span>
              <span className={styles.foodName}>{food.name}</span>
              {food._edited && <span className={styles.editedBadge}>edited</span>}
            </span>
            <span className={styles.colNum}>{food.servingSize} {food.servingUnit}</span>
            <span className={styles.colNum} data-type="cal">{food.calories}</span>
            <span className={styles.colNum} data-type="p">{food.protein}g</span>
            <span className={styles.colNum} data-type="c">{food.carbs}g</span>
            <span className={styles.colNum} data-type="f">{food.fat}g</span>
            <span className={styles.colAct}>
              <button className={styles.editBtn} onClick={() => openEdit(food)}>✏️</button>
              {food._edited && (
                <button className={styles.resetBtn} onClick={e => handleReset(food, e)} title="Reset to default">↩</button>
              )}
            </span>
          </div>
        ))}

        {foods.length === 0 && (
          <div className={styles.empty}>No foods match your search</div>
        )}
      </div>

      {/* ── Edit modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) closeEdit() }}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{    opacity: 0, scale: 0.95, y: 24 }}
              transition={{ duration: 0.22 }}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Edit Food</h3>
                  <p className={styles.modalSub}>{editing.id}</p>
                </div>
                <button className={styles.closeBtn} onClick={closeEdit}>✕</button>
              </div>

              <div className={styles.modalBody}>
                {/* Name + category */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Food name</label>
                    <input className="input" value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Category</label>
                    <select className="input" value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Serving */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Serving size (number)</label>
                    <input className="input" type="number" min="0.1" step="0.1"
                      value={form.servingSize}
                      onChange={e => setForm(p => ({ ...p, servingSize: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Serving unit (g / ml / piece…)</label>
                    <input className="input" value={form.servingUnit}
                      onChange={e => setForm(p => ({ ...p, servingUnit: e.target.value }))} />
                  </div>
                </div>

                {/* Macros */}
                <div className={styles.macroGrid}>
                  {MACRO_FIELDS.map(({ key, label, color }) => (
                    <div key={key} className={styles.macroField}>
                      <label className={styles.macroLabel} style={{ color: `var(${color})` }}>
                        {label}
                      </label>
                      <input
                        className={`input ${styles.macroInput}`}
                        type="number" min="0" step="0.1"
                        value={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        style={{ borderColor: `var(${color})` }}
                      />
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div className={styles.preview}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Per {form.servingSize || '?'} {form.servingUnit}</span>
                  <span style={{ color: 'var(--cal)'     }}>{form.calories} kcal</span>
                  <span style={{ color: 'var(--protein)' }}>{form.protein}g P</span>
                  <span style={{ color: 'var(--carbs)'   }}>{form.carbs}g C</span>
                  <span style={{ color: 'var(--fat)'     }}>{form.fat}g F</span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button className="btn btn-ghost" onClick={closeEdit}>Cancel</button>
                <motion.button
                  className="btn btn-brand"
                  onClick={handleSave}
                  disabled={saving}
                  whileTap={{ scale: 0.97 }}
                >
                  {saving ? 'Saving…' : '💾 Save globally'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
