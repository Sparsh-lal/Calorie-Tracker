import { createSlice } from '@reduxjs/toolkit'
import { savePresetsToFirestore } from '../../utils/firestore'

const presetsSlice = createSlice({
  name: 'presets',
  initialState: { presets: [] },
  reducers: {
    addPreset(state, action) {
      state.presets.push(action.payload)
      savePresetsToFirestore(state.presets)
    },
    updatePreset(state, action) {
      const idx = state.presets.findIndex(p => p.id === action.payload.id)
      if (idx !== -1) {
        state.presets[idx] = action.payload
        savePresetsToFirestore(state.presets)
      }
    },
    deletePreset(state, action) {
      state.presets = state.presets.filter(p => p.id !== action.payload)
      savePresetsToFirestore(state.presets)
    },
    loadPresets(state, action) {
      state.presets = action.payload || []
    },
    resetPresets(state) {
      state.presets = []
    },
  },
})

export const { addPreset, updatePreset, deletePreset, loadPresets, resetPresets } = presetsSlice.actions
export default presetsSlice.reducer
