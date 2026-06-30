import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "REDACTED_FIREBASE_API_KEY",
  authDomain:        "sparshs-calorie-tracker.firebaseapp.com",
  projectId:         "sparshs-calorie-tracker",
  storageBucket:     "sparshs-calorie-tracker.firebasestorage.app",
  messagingSenderId: "REDACTED_SENDER_ID",
  appId:             "REDACTED_FIREBASE_APP_ID",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
