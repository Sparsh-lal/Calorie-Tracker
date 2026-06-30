import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,   // { uid, name, username }
    authLoading: true,   // true until Firebase resolves initial auth state
    authError:   null,
  },
  reducers: {
    setUser(state, action) {
      state.user        = action.payload
      state.authLoading = false
      state.authError   = null
    },
    clearUser(state) {
      state.user        = null
      state.authLoading = false
      state.authError   = null
    },
    setAuthLoading(state, action) {
      state.authLoading = action.payload
    },
    setAuthError(state, action) {
      state.authError   = action.payload
      state.authLoading = false
    },
  },
})

export const { setUser, clearUser, setAuthLoading, setAuthError } = authSlice.actions
export default authSlice.reducer
