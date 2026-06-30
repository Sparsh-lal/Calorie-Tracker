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
  { value: 'lose',     label: 'Lose Weight',    delta: -500, note: '−500 kcal/day ≈ 0.5 kg/week loss'   },
  { value: 'maintain', label: 'Maintain Weight', delta:    0, note: 'Eat at maintenance calories'         },
  { value: 'gain',     label: 'Build Muscle',    delta: +300, note: '+300 kcal/day lean bulk'             },
]

/** Mifflin-St Jeor BMR (kcal/day) */
export function calcBMR({ weight, height, age, gender }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(gender === 'female' ? base - 161 : base + 5)
}

/**
 * Full TDEE breakdown.
 * Returns null if required fields are missing.
 */
export function calcTDEE(profile) {
  const { weight, height, age, gender, activity, goal } = profile
  if (!weight || !height || !age || weight <= 0 || height <= 0 || age <= 0) return null

  const bmr        = calcBMR({ weight, height, age, gender })
  const multiplier = ACTIVITY_OPTIONS.find(a => a.value === activity)?.multiplier ?? 1.55
  const tdee       = Math.round(bmr * multiplier)
  const goalDelta  = GOAL_OPTIONS.find(g => g.value === goal)?.delta ?? 0
  const targetCal  = Math.max(1200, tdee + goalDelta)

  return { bmr, tdee, targetCalories: targetCal }
}

/**
 * Auto-calculate macros from a calorie target and body weight.
 *   Protein: 1.8 g/kg body weight
 *   Fat:     25% of total calories
 *   Carbs:   remainder
 */
export function calcMacros(targetCalories, weight) {
  const protein = Math.round(weight * 1.8)
  const fat     = Math.round((targetCalories * 0.25) / 9)
  const carbs   = Math.max(0, Math.round((targetCalories - protein * 4 - fat * 9) / 4))
  return { calories: targetCalories, protein, carbs, fat }
}
