import { setEntries } from './foodLogSlice'
import { loadGoals }  from './goalsSlice'
import { setTheme }   from './uiSlice'
import { loadFromStorage } from '../../utils/storage'

/** Thunk — loads all persisted state from localStorage on app start */
export const loadState = () => dispatch => {
  const entries = loadFromStorage('cal_log',   {})
  const goals   = loadFromStorage('cal_goals', null)
  const theme   = loadFromStorage('cal_theme', 'light')

  dispatch(setEntries(entries))
  if (goals) dispatch(loadGoals(goals))
  dispatch(setTheme(theme))
}
