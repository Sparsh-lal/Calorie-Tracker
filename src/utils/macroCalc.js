/**
 * Macro calculation utilities
 */

/** Round to at most 1 decimal place */
function round1(n) {
  return Math.round(n * 10) / 10
}

/**
 * Scale a food's macros by a given quantity relative to its serving size.
 *
 * @param {object} food  — food object from foods.json
 * @param {number} quantity — actual amount consumed (same unit as food.servingUnit)
 * @returns {{ calories, protein, carbs, fat }}
 */
export function scaleMacros(food, quantity) {
  const factor = quantity / food.servingSize
  return {
    calories: round1(food.calories * factor),
    protein:  round1(food.protein  * factor),
    carbs:    round1(food.carbs    * factor),
    fat:      round1(food.fat      * factor),
  }
}

/**
 * Sum all log entries for a day.
 *
 * @param {Array} entries  — array of log entry objects
 * @returns {{ calories, protein, carbs, fat }}
 */
export function sumEntries(entries = []) {
  return entries.reduce(
    (acc, e) => ({
      calories: round1(acc.calories + (e.calories || 0)),
      protein:  round1(acc.protein  + (e.protein  || 0)),
      carbs:    round1(acc.carbs    + (e.carbs    || 0)),
      fat:      round1(acc.fat      + (e.fat      || 0)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

/** Percentage complete, capped at 100 */
export function pct(value, goal) {
  if (!goal || goal <= 0) return 0
  return Math.min(100, (value / goal) * 100)
}
