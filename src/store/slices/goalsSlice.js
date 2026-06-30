import { createSlice } from '@reduxjs/toolkit'
import { saveToStorage } from '../../utils/storage'
import { DEFAULT_MEAL_NAMES } from '../../utils/tdeeCalc'

const STORAGE_KEY = 'cal_goals'

const DEFAULT_PROFILE = {
  weight:       70,         // kg
  targetWeight: 65,         // kg
  height:       170,        // cm
  age:          25,
  gender:       'male',     // 'male' | 'female'
  activity:     'moderate', // see ACTIVITY_OPTIONS
  goal:         'maintain', // 'lose' | 'maintain' | 'gain'
}

const DEFAULT_GOALS = {
  calories: 2000,
  protein:  150,
  carbs:    200,
  fat:       65,
  meals:    [...DEFAULT_MEAL_NAMES],  // editable meal names
  profile:  { ...DEFAULT_PROFILE },
}

function persist(state) {
  saveToStorage(STORAGE_KEY, {
    calories: state.calories,
    protein:  state.protein,
    carbs:    state.carbs,
    fat:      state.fat,
    meals:    state.meals,
    profile:  state.profile,
  })
}

const goalsSlice = createSlice({
  name: 'goals',
  initialState: { ...DEFAULT_GOALS },
  reducers: {
    setGoals(state, action) {
      const g = action.payload
      state.calories = Number(g.calories)
      state.protein  = Number(g.protein)
      state.carbs    = Number(g.carbs)
      state.fat      = Number(g.fat)
      persist(state)
    },
    /** Rename a single meal slot (index 0-3). Only affects future entries. */
    setMealName(state, action) {
      const { index, name } = action.payload
      if (index >= 0 && index < state.meals.length && name.trim()) {
        state.meals[index] = name.trim()
        persist(state)
      }
    },
    setMeals(state, action) {
      state.meals = action.payload
      persist(state)
    },
    setProfile(state, action) {
      state.profile = { ...state.profile, ...action.payload }
      persist(state)
    },
    /** Used by persistSlice to hydrate from localStorage */
    loadGoals(state, action) {
      const g = action.payload
      state.calories = Number(g.calories) || DEFAULT_GOALS.calories
      state.protein  = Number(g.protein)  || DEFAULT_GOALS.protein
      state.carbs    = Number(g.carbs)    || DEFAULT_GOALS.carbs
      state.fat      = Number(g.fat)      || DEFAULT_GOALS.fat
      state.meals    = Array.isArray(g.meals) && g.meals.length === 4
                         ? g.meals
                         : [...DEFAULT_MEAL_NAMES]
      state.profile  = g.profile ? { ...DEFAULT_PROFILE, ...g.profile } : { ...DEFAULT_PROFILE }
    },
  },
})

export const { setGoals, setMealName, setMeals, setProfile, loadGoals } = goalsSlice.actions
export default goalsSlice.reducer
