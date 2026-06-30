import { createSlice } from '@reduxjs/toolkit'
import { saveCustomFoodsToFirestore } from '../../utils/firestore'

const customFoodsSlice = createSlice({
  name: 'customFoods',
  initialState: { foods: [] },
  reducers: {
    addCustomFood(state, action) {
      state.foods.push(action.payload)
      saveCustomFoodsToFirestore(state.foods)
    },
    updateCustomFood(state, action) {
      const idx = state.foods.findIndex(f => f.id === action.payload.id)
      if (idx !== -1) {
        state.foods[idx] = action.payload
        saveCustomFoodsToFirestore(state.foods)
      }
    },
    deleteCustomFood(state, action) {
      state.foods = state.foods.filter(f => f.id !== action.payload)
      saveCustomFoodsToFirestore(state.foods)
    },
    loadCustomFoods(state, action) {
      state.foods = action.payload || []
    },
    resetCustomFoods(state) {
      state.foods = []
    },
  },
})

export const { addCustomFood, updateCustomFood, deleteCustomFood, loadCustomFoods, resetCustomFoods } = customFoodsSlice.actions
export default customFoodsSlice.reducer
