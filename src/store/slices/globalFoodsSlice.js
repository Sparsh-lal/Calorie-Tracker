import { createSlice } from '@reduxjs/toolkit'

/**
 * Stores admin-edited food overrides from Firestore /foods collection.
 * Shape: { [foodId]: { id, name, category, servingSize, servingUnit, calories, protein, carbs, fat } }
 * Only foods that have been edited by the admin appear here.
 * All other foods fall back to foods.json defaults.
 */
const globalFoodsSlice = createSlice({
  name: 'globalFoods',
  initialState: {
    overrides: {},   // { [foodId]: overriddenFoodObject }
    loaded:    false,
  },
  reducers: {
    setGlobalFoods(state, action) {
      const map = {}
      action.payload.forEach(f => { map[f.id] = f })
      state.overrides = map
      state.loaded    = true
    },
    upsertOverride(state, action) {
      state.overrides[action.payload.id] = action.payload
    },
    removeOverride(state, action) {
      delete state.overrides[action.payload]
    },
  },
})

export const { setGlobalFoods, upsertOverride, removeOverride } = globalFoodsSlice.actions
export default globalFoodsSlice.reducer
