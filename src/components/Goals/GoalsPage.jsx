import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { setGoals, setMeals, setProfile } from '../../store/slices/goalsSlice'
import { MEAL_ICONS, ACTIVITY_OPTIONS, GOAL_OPTIONS, calcTDEE, calcMacros } from '../../utils/tdeeCalc'
import toast from 'react-hot-toast'
import styles from './GoalsPage.module.css'

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

const MACRO_FIELDS = [
  { key: 'calories', label: 'Daily Calories', icon: '🔥', unit: 'kcal', colorVar: '--cal',     hint: 'Total energy target per day.' },
  { key: 'protein',  label: 'Daily Protein',  icon: '💪', unit: 'g',    colorVar: '--protein', hint: 'Aim for 1.6–2.2 g per kg of body weight.' },
  { key: 'carbs',    label: 'Daily Carbs',    icon: '🌾', unit: 'g',    colorVar: '--carbs',   hint: 'Carbs supply ~45–65% of daily calories.' },
  { key: 'fat',      label: 'Daily Fat',      icon: '🫒', unit: 'g',    colorVar: '--fat',     hint: 'Healthy fats: ~20–35% of daily calories.' },
]

// ─────────────────────────────────────────────────────────────────
// Profile & TDEE Calculator
// ─────────────────────────────────────────────────────────────────
function ProfileCard({ profile, onApply }) {
  const [form, setForm] = useState({ ...profile })
  const [result, setResult] = useState(null)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleCalculate() {
    const tdee = calcTDEE({ ...form, weight: Number(form.weight), height: Number(form.height), age: Number(form.age) })
    if (!tdee) { toast.error('Fill in weight, height and age'); return }
    const macros = calcMacros(tdee.targetCalories, Number(form.weight))
    setResult({ ...tdee, ...macros })
  }

  function handleApply() {
    if (!result) { handleCalculate(); return }
    onApply(form, result)
  }

  return (
    <div className={`card card-pad ${styles.profileCard}`}>
      <h3 className={styles.cardTitle}>⚖️ Body Profile & Auto-Calculate</h3>
      <p className={styles.cardSub}>
        Enter your stats to auto-calculate personalised macro targets. You can still adjust them manually after.
      </p>

      <div className={styles.profileGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fLabel}>Current Weight (kg)</label>
          <input className="input" type="number" min="1" step="0.1" value={form.weight}
            onChange={e => set('weight', e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fLabel}>Target Weight (kg)</label>
          <input className="input" type="number" min="1" step="0.1" value={form.targetWeight}
            onChange={e => set('targetWeight', e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fLabel}>Height (cm)</label>
          <input className="input" type="number" min="1" step="1" value={form.height}
            onChange={e => set('height', e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fLabel}>Age</label>
          <input className="input" type="number" min="1" max="120" step="1" value={form.age}
            onChange={e => set('age', e.target.value)} />
        </div>
      </div>

      <div className={styles.radioRow}>
        <span className={styles.fLabel}>Gender</span>
        <div className={styles.radioGroup}>
          {['male', 'female'].map(g => (
            <label key={g} className={`${styles.radioLabel} ${form.gender === g ? styles.radioActive : ''}`}>
              <input type="radio" name="gender" value={g} checked={form.gender === g}
                onChange={() => set('gender', g)} className={styles.radioInput} />
              {g === 'male' ? '♂ Male' : '♀ Female'}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fLabel}>Activity Level</label>
        <select className="input" value={form.activity} onChange={e => set('activity', e.target.value)}>
          {ACTIVITY_OPTIONS.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.radioRow}>
        <span className={styles.fLabel}>Goal</span>
        <div className={styles.goalGroup}>
          {GOAL_OPTIONS.map(g => (
            <label key={g.value} className={`${styles.goalLabel} ${form.goal === g.value ? styles.goalActive : ''}`}>
              <input type="radio" name="goal" value={g.value} checked={form.goal === g.value}
                onChange={() => set('goal', g.value)} className={styles.radioInput} />
              <span className={styles.goalTitle}>{g.label}</span>
              <span className={styles.goalNote}>{g.note}</span>
            </label>
          ))}
        </div>
      </div>

      {result && (
        <motion.div
          className={styles.resultBox}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.resultRow}>
            <span>BMR</span><strong>{result.bmr} kcal</strong>
          </div>
          <div className={styles.resultRow}>
            <span>TDEE (maintenance)</span><strong>{result.tdee} kcal</strong>
          </div>
          <div className={`${styles.resultRow} ${styles.resultTarget}`}>
            <span>🎯 Target calories</span><strong>{result.targetCalories} kcal</strong>
          </div>
          <hr className="divider" />
          <div className={styles.resultMacros}>
            <span>💪 Protein <strong>{result.protein}g</strong></span>
            <span>🌾 Carbs <strong>{result.carbs}g</strong></span>
            <span>🫒 Fat <strong>{result.fat}g</strong></span>
          </div>
        </motion.div>
      )}

      <div className={styles.profileActions}>
        <button className="btn btn-outline" onClick={handleCalculate}>
          📊 Calculate
        </button>
        <motion.button
          className="btn btn-brand"
          onClick={handleApply}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          ✓ Apply to Goals
        </motion.button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Meal Names Editor
// ─────────────────────────────────────────────────────────────────
function MealNamesCard({ meals, onSave }) {
  const [names, setNames] = useState([...meals])

  function handleChange(idx, val) {
    const next = [...names]
    next[idx] = val
    setNames(next)
  }

  function handleSave() {
    if (names.some(n => !n.trim())) { toast.error('Meal names cannot be empty'); return }
    onSave(names.map(n => n.trim()))
    toast.success('Meal names saved — new entries will use these names')
  }

  const isDirty = names.some((n, i) => n.trim() !== meals[i])

  return (
    <div className={`card card-pad ${styles.mealCard}`}>
      <h3 className={styles.cardTitle}>🍽️ Meal Names</h3>
      <p className={styles.cardSub}>
        Rename meals as you like. Changes apply to new entries only — past logs are not affected.
      </p>
      <div className={styles.mealList}>
        {names.map((name, idx) => (
          <div key={idx} className={styles.mealNameRow}>
            <span className={styles.mealIcon}>{MEAL_ICONS[idx]}</span>
            <input
              className={`input ${styles.mealNameInput}`}
              type="text"
              value={name}
              maxLength={30}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder={`Meal ${idx + 1}`}
            />
          </div>
        ))}
      </div>
      <div className={styles.mealActions}>
        <button className="btn btn-outline" onClick={() => setNames([...meals])}>
          Discard
        </button>
        <motion.button
          className="btn btn-brand"
          onClick={handleSave}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isDirty ? '💾 Save Names' : '✓ Saved'}
        </motion.button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Macro Goals Form
// ─────────────────────────────────────────────────────────────────
function MacroGoalsCard({ savedGoals }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    calories: String(savedGoals.calories),
    protein:  String(savedGoals.protein),
    carbs:    String(savedGoals.carbs),
    fat:      String(savedGoals.fat),
  })

  // Re-sync form when savedGoals changes (e.g. after Apply from profile)
  const [prevSaved, setPrevSaved] = useState(savedGoals)
  if (savedGoals !== prevSaved) {
    setPrevSaved(savedGoals)
    setForm({
      calories: String(savedGoals.calories),
      protein:  String(savedGoals.protein),
      carbs:    String(savedGoals.carbs),
      fat:      String(savedGoals.fat),
    })
  }

  function handleSave() {
    const parsed = Object.fromEntries(MACRO_FIELDS.map(f => [f.key, parseFloat(form[f.key])]))
    if (Object.values(parsed).some(v => isNaN(v) || v <= 0)) {
      toast.error('All goals must be positive numbers'); return
    }
    dispatch(setGoals(parsed))
    toast.success('Macro goals saved!')
  }

  function handleReset() {
    const d = { calories: 2000, protein: 150, carbs: 200, fat: 65 }
    setForm(Object.fromEntries(Object.entries(d).map(([k,v]) => [k, String(v)])))
    dispatch(setGoals(d))
    toast.success('Goals reset to defaults')
  }

  const isDirty = MACRO_FIELDS.some(f => String(savedGoals[f.key]) !== form[f.key])

  return (
    <div className={`card card-pad ${styles.macroCard}`}>
      <h3 className={styles.cardTitle}>🎯 Daily Macro Goals</h3>
      <p className={styles.cardSub}>Set your targets manually or auto-fill them from the profile calculator.</p>

      <div className={styles.macroFields}>
        {MACRO_FIELDS.map(field => (
          <div key={field.key} className={styles.macroFieldRow}>
            <div className={styles.macroFieldLabel}>
              <span>{field.icon}</span>
              <span style={{ color: `var(${field.colorVar})` }}>{field.label}</span>
              <span className={styles.macroHint}>{field.hint}</span>
            </div>
            <div className={styles.macroInputRow}>
              <input
                className={`input ${styles.macroInput}`}
                type="number" min="1" step="any"
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
              <span className={styles.unitTag}>{field.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Calorie breakdown note */}
      <div className={styles.calBreakdown}>
        <div className={styles.calBreakTitle}>Calorie breakdown from macros</div>
        {[
          { icon: '💪', label: 'Protein', kcal: (parseFloat(form.protein) || 0) * 4 },
          { icon: '🌾', label: 'Carbs',   kcal: (parseFloat(form.carbs)   || 0) * 4 },
          { icon: '🫒', label: 'Fat',     kcal: (parseFloat(form.fat)     || 0) * 9 },
        ].map(r => (
          <div key={r.label} className={styles.calBreakRow}>
            <span>{r.icon} {r.label}</span>
            <span>{r.kcal.toFixed(0)} kcal</span>
          </div>
        ))}
        <div className={`${styles.calBreakRow} ${styles.calBreakTotal}`}>
          <span>🔥 Total from macros</span>
          <span>{(
            (parseFloat(form.protein) || 0) * 4 +
            (parseFloat(form.carbs)   || 0) * 4 +
            (parseFloat(form.fat)     || 0) * 9
          ).toFixed(0)} kcal</span>
        </div>
      </div>

      <div className={styles.macroActions}>
        <button className="btn btn-outline" onClick={handleReset}>Reset defaults</button>
        <motion.button
          className="btn btn-brand"
          onClick={handleSave}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isDirty ? '💾 Save Goals' : '✓ Saved'}
        </motion.button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const dispatch   = useDispatch()
  const savedGoals = useSelector(s => s.goals)
  const profile    = useSelector(s => s.goals.profile)
  const meals      = useSelector(s => s.goals.meals)

  function handleApplyProfile(formProfile, macros) {
    dispatch(setProfile({
      weight:       Number(formProfile.weight),
      targetWeight: Number(formProfile.targetWeight),
      height:       Number(formProfile.height),
      age:          Number(formProfile.age),
      gender:       formProfile.gender,
      activity:     formProfile.activity,
      goal:         formProfile.goal,
    }))
    dispatch(setGoals({
      calories: macros.calories,
      protein:  macros.protein,
      carbs:    macros.carbs,
      fat:      macros.fat,
    }))
    toast.success('Profile saved & macros applied!')
  }

  function handleSaveMeals(names) {
    dispatch(setMeals(names))
  }

  return (
    <motion.div
      key="goals"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="container section-pad">
        <div className={styles.layout}>
          {/* Left column */}
          <div className={styles.leftCol}>
            <ProfileCard profile={profile} onApply={handleApplyProfile} />
            <MealNamesCard meals={meals} onSave={handleSaveMeals} />
          </div>

          {/* Right column */}
          <div className={styles.rightCol}>
            <MacroGoalsCard savedGoals={savedGoals} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
