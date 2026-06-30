import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'

// ── Entries ─────────────────────────────────────────────────────
export async function saveEntriesToFirestore(entries) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid, 'data', 'foodLog'), { entries })
  } catch (e) {
    console.error('Firestore save entries error:', e)
  }
}

// ── Goals ────────────────────────────────────────────────────────
export async function saveGoalsToFirestore(goals) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid, 'data', 'goals'), goals)
  } catch (e) {
    console.error('Firestore save goals error:', e)
  }
}

// ── Custom foods ─────────────────────────────────────────────────
export async function saveCustomFoodsToFirestore(foods) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid, 'data', 'customFoods'), { foods })
  } catch (e) {
    console.error('Firestore save customFoods error:', e)
  }
}

// ── Presets ──────────────────────────────────────────────────────
export async function savePresetsToFirestore(presets) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid, 'data', 'presets'), { presets })
  } catch (e) {
    console.error('Firestore save presets error:', e)
  }
}

// ── Load all data for a UID ──────────────────────────────────────
export async function loadUserData(uid) {
  try {
    const [logSnap, goalsSnap, customFoodsSnap, presetsSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid, 'data', 'foodLog')),
      getDoc(doc(db, 'users', uid, 'data', 'goals')),
      getDoc(doc(db, 'users', uid, 'data', 'customFoods')),
      getDoc(doc(db, 'users', uid, 'data', 'presets')),
    ])
    return {
      entries:     logSnap.exists()         ? logSnap.data().entries          : {},
      goals:       goalsSnap.exists()       ? goalsSnap.data()                : null,
      customFoods: customFoodsSnap.exists() ? customFoodsSnap.data().foods    : [],
      presets:     presetsSnap.exists()     ? presetsSnap.data().presets      : [],
    }
  } catch (e) {
    console.error('Firestore load error:', e)
    return { entries: {}, goals: null, customFoods: [], presets: [] }
  }
}

// ── Save user profile (name + username) ─────────────────────────
export async function saveUserProfile(uid, profile) {
  try {
    await setDoc(doc(db, 'users', uid), profile, { merge: true })
  } catch (e) {
    console.error('Firestore save profile error:', e)
  }
}
