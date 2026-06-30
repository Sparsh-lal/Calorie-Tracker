import { setEntries } from './foodLogSlice'
import { loadGoals }  from './goalsSlice'
import { setTheme }   from './uiSlice'
import { loadFromStorage } from '../../utils/storage'
import { loadUserData } from '../../utils/firestore'

/** Thunk — loads user data from Firestore after login */
export const loadState = (uid) => async dispatch => {
  const { entries, goals } = await loadUserData(uid)
  dispatch(setEntries(entries))
  if (goals) dispatch(loadGoals(goals))
  // theme is still a local UI preference
  const theme = loadFromStorage('cal_theme', 'light')
  dispatch(setTheme(theme))
}
