import { setEntries } from './foodLogSlice'
import { loadGoals }  from './goalsSlice'
import { setTheme }   from './uiSlice'
import { loadCustomFoods } from './customFoodsSlice'
import { loadPresets } from './presetsSlice'
import { loadFromStorage } from '../../utils/storage'
import { loadUserData } from '../../utils/firestore'

/** Thunk — loads user data from Firestore after login */
export const loadState = (uid) => async dispatch => {
  const { entries, goals, customFoods, presets } = await loadUserData(uid)
  dispatch(setEntries(entries))
  if (goals) dispatch(loadGoals(goals))
  dispatch(loadCustomFoods(customFoods))
  dispatch(loadPresets(presets))
  const theme = loadFromStorage('cal_theme', 'light')
  dispatch(setTheme(theme))
}

/** Thunk — guest mode: no Firestore, just restore theme */
export const loadGuestState = () => dispatch => {
  const theme = loadFromStorage('cal_theme', 'light')
  dispatch(setTheme(theme))
}
