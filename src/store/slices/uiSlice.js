import { createSlice } from '@reduxjs/toolkit'
import { saveToStorage } from '../../utils/storage'
import { todayKey } from '../../utils/dateHelpers'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme:      'light',       // 'light' | 'dark'
    page:       'dashboard',   // 'dashboard' | 'history' | 'goals' | 'presets' | 'admin'
    activeDate: todayKey(),    // "YYYY-MM-DD" used by History
  },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      saveToStorage('cal_theme', state.theme)
    },
    setTheme(state, action) {
      state.theme = action.payload
    },
    setPage(state, action) {
      state.page = action.payload
    },
    setActiveDate(state, action) {
      state.activeDate = action.payload
    },
  },
})

export const { toggleTheme, setTheme, setPage, setActiveDate } = uiSlice.actions
export default uiSlice.reducer
