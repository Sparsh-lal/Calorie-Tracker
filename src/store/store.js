import { configureStore } from '@reduxjs/toolkit'
import foodLogReducer     from './slices/foodLogSlice'
import goalsReducer       from './slices/goalsSlice'
import uiReducer          from './slices/uiSlice'
import authReducer        from './slices/authSlice'
import customFoodsReducer from './slices/customFoodsSlice'
import presetsReducer     from './slices/presetsSlice'
import globalFoodsReducer from './slices/globalFoodsSlice'

export const store = configureStore({
  reducer: {
    foodLog:     foodLogReducer,
    goals:       goalsReducer,
    ui:          uiReducer,
    auth:        authReducer,
    customFoods: customFoodsReducer,
    presets:     presetsReducer,
    globalFoods: globalFoodsReducer,
  },
})
