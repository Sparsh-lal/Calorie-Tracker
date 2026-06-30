import { setEntries } from './foodLogSlice'
import { loadGoals }  from './goalsSlice'
import { setTheme }   from './uiSlice'
import { loadCustomFoods } from './customFoodsSlice'
import { loadPresets } from './presetsSlice'
import { setGlobalFoods } from './globalFoodsSlice'
import { loadFromStorage } from '../../utils/storage'
import { loadUserData, loadGlobalFoods } from '../../utils/firestore'

/** Thunk — loads user data + global food overrides from Firestore after login */
export const loadState = (uid) => async dispatch => {
  const [userData, globalFoods] = await Promise.all([
    loadUserData(uid),
    loadGlobalFoods(),
  ])
  const { entries, goals, customFoods, presets } = userData
  dispatch(setEntries(entries))
  if (goals) dispatch(loadGoals(goals))
  dispatch(loadCustomFoods(customFoods))
  dispatch(loadPresets(presets))
  dispatch(setGlobalFoods(globalFoods))
  const theme = loadFromStorage('cal_theme', 'light')
  dispatch(setTheme(theme))
}

/** Thunk — guest mode: no user data, but still load public food overrides */
export const loadGuestState = () => async dispatch => {
  const theme = loadFromStorage('cal_theme', 'light')
  dispatch(setTheme(theme))
  const globalFoods = await loadGlobalFoods()
  dispatch(setGlobalFoods(globalFoods))
}
