import { configureStore } from '@reduxjs/toolkit'
import foodLogReducer from './slices/foodLogSlice'
import goalsReducer   from './slices/goalsSlice'
import uiReducer      from './slices/uiSlice'
import authReducer    from './slices/authSlice'

export const store = configureStore({
  reducer: {
    foodLog: foodLogReducer,
    goals:   goalsReducer,
    ui:      uiReducer,
    auth:    authReducer,
  },
})
