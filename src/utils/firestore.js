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

// ── Load all data for a UID ──────────────────────────────────────
export async function loadUserData(uid) {
  try {
    const [logSnap, goalsSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid, 'data', 'foodLog')),
      getDoc(doc(db, 'users', uid, 'data', 'goals')),
    ])
    return {
      entries: logSnap.exists()   ? logSnap.data().entries : {},
      goals:   goalsSnap.exists() ? goalsSnap.data()       : null,
    }
  } catch (e) {
    console.error('Firestore load error:', e)
    return { entries: {}, goals: null }
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
