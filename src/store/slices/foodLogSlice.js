import { createSlice } from '@reduxjs/toolkit'
import { saveEntriesToFirestore } from '../../utils/firestore'


const foodLogSlice = createSlice({
  name: 'foodLog',
  initialState: {
    // { "YYYY-MM-DD": [ entry, ... ] }
    entries: {},
  },
  reducers: {
    addEntry(state, action) {
      const { dateKey, entry } = action.payload
      if (!state.entries[dateKey]) state.entries[dateKey] = []
      state.entries[dateKey].push(entry)
      saveEntriesToFirestore(state.entries)
    },
    updateEntry(state, action) {
      const { dateKey, entryId, updates } = action.payload
      const list = state.entries[dateKey]
      if (!list) return
      const idx = list.findIndex(e => e.id === entryId)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates }
        saveEntriesToFirestore(state.entries)
      }
    },
    deleteEntry(state, action) {
      const { dateKey, entryId } = action.payload
      if (!state.entries[dateKey]) return
      state.entries[dateKey] = state.entries[dateKey].filter(e => e.id !== entryId)
      saveEntriesToFirestore(state.entries)
    },
    /** Used by persistSlice to hydrate state from Firestore */
    setEntries(state, action) {
      state.entries = action.payload
    },
    clearEntries(state) {
      state.entries = {}
    },
  },
})

export const { addEntry, updateEntry, deleteEntry, setEntries, clearEntries } = foodLogSlice.actions
export default foodLogSlice.reducer
