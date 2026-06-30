/**
 * TDEE (Total Daily Energy Expenditure) and macro calculation utilities.
 * Uses the Mifflin-St Jeor BMR equation.
 */

export const MEAL_ICONS = ['🌅', '☀️', '🌙', '🍎']

export const DEFAULT_MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Sedentary (desk job, little/no exercise)',   multiplier: 1.2   },
  { value: 'light',       label: 'Lightly Active (1–3 days/week)',              multiplier: 1.375 },
  { value: 'moderate',    label: 'Moderately Active (3–5 days/week)',           multiplier: 1.55  },
  { value: 'active',      label: 'Very Active (6–7 days/week)',                 multiplier: 1.725 },
  { value: 'very_active', label: 'Extra Active (physical job + daily training)', multiplier: 1.9  },
]

export const GOAL_OPTIONS = [
  { value: 'lose',     label: 'Lose Weight',    delta: -500, note: 'Deficit calculated from your current vs target weight' },
  { value: 'maintain', label: 'Maintain Weight', delta:    0, note: 'Eat at maintenance calories'                          },
  { value: 'gain',     label: 'Build Muscle',    delta: +300, note: '+300 kcal/day lean bulk'                              },
]

/** 1 kg of body fat stores approximately 7700 kcal (source: GetShredded) */
export const KCAL_PER_KG_FAT = 7700

/** Mifflin-St Jeor BMR (kcal/day) */
export function calcBMR({ weight, height, age, gender }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(gender === 'female' ? base - 161 : base + 5)
}

/**
 * Calculate daily calorie delta from current vs target weight.
 * Book principle (GetShredded): never starve — a sustainable deficit preserves muscle.
 * A safe rate is 0.5–1% of body weight per week.
 * 1 kg body fat ≈ 7700 kcal, so daily deficit = (weeklyRate × 7700) / 7.
 * Capped at 700 kcal/day to prevent metabolic slowdown.
 */
export function calcGoalDelta(weight, targetWeight, goal) {
  if (goal === 'maintain') return 0
  if (goal === 'gain')     return 300  // lean bulk surplus

  // Fat loss: derive deficit from the weight gap
  const weightToLose = Number(weight) - Number(targetWeight)
  if (weightToLose <= 0) return 0   // already at or below target

  // Safe weekly rate: 0.7% of body weight, clamped to 0.25–1.0 kg/week
  const weeklyRateKg   = Math.min(Math.max(weight * 0.007, 0.25), 1.0)
  const dailyDeficit   = Math.round((weeklyRateKg * KCAL_PER_KG_FAT) / 7)
  return -Math.min(dailyDeficit, 700)
}

/**
 * Full TDEE breakdown.
 * Returns null if required fields are missing.
 */
export function calcTDEE(profile) {
  const { weight, height, age, gender, activity, goal, targetWeight } = profile
  if (!weight || !height || !age || weight <= 0 || height <= 0 || age <= 0) return null

  const bmr        = calcBMR({ weight, height, age, gender })
  const multiplier = ACTIVITY_OPTIONS.find(a => a.value === activity)?.multiplier ?? 1.55
  const tdee       = Math.round(bmr * multiplier)
  const goalDelta  = calcGoalDelta(Number(weight), Number(targetWeight ?? weight), goal)
  const targetCal  = Math.max(1200, tdee + goalDelta)

  // Estimated timeline to reach target weight
  const weightDiff   = Math.abs(Number(weight) - Number(targetWeight ?? weight))
  const weeklyRateKg = Math.abs(goalDelta) > 0
    ? Math.round((Math.abs(goalDelta) * 7) / KCAL_PER_KG_FAT * 10) / 10
    : 0
  const weeksToGoal  = weeklyRateKg > 0 && weightDiff > 0
    ? Math.ceil(weightDiff / weeklyRateKg)
    : null

  return { bmr, tdee, targetCalories: targetCal, goalDelta, weeklyRateKg, weeksToGoal }
}

/**
 * Auto-calculate macros from a calorie target, body weight, and goal.
 *
 * Source principles (GetShredded):
 *   • High protein during fat loss/gain preserves & builds muscle (author's key lesson).
 *   • Essential fats must never be cut — the brain cannot function without them.
 *   • Prefer complex carbs (avoid insulin spikes that halt fat burning).
 *
 * Protein: 2.2 g/kg for lose/gain goals | 1.8 g/kg for maintenance
 * Fat:     max(25% of calories, 0.8 g/kg) — essential fat floor
 * Carbs:   remaining calories ÷ 4 (fill with complex carbs)
 */
export function calcMacros(targetCalories, weight, goal = 'maintain') {
  const proteinPerKg = (goal === 'lose' || goal === 'gain') ? 2.2 : 1.8
  const protein      = Math.round(weight * proteinPerKg)
  const fatByPct     = Math.round((targetCalories * 0.25) / 9)
  const fatFloor     = Math.round(weight * 0.8)          // essential fat minimum
  const fat          = Math.max(fatByPct, fatFloor)
  const carbs        = Math.max(0, Math.round((targetCalories - protein * 4 - fat * 9) / 4))
  return { calories: targetCalories, protein, carbs, fat }
}
