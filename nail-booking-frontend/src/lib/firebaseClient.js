// Firestore realtime (read-only) for the admin dashboard.
// Status changes still go through the backend API; this only *listens*.
// Enabled when the Firebase web config is present in env; otherwise the
// dashboard falls back to API polling (see DataContext).
import { initializeApp } from 'firebase/app'
import { collection, getFirestore, onSnapshot } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const FIREBASE_ENABLED = Boolean(cfg.apiKey && cfg.projectId)
const db = FIREBASE_ENABLED ? getFirestore(initializeApp(cfg)) : null

// Subscribe to ALL bookings (owner view). Returns an unsubscribe function.
export function watchAllBookings(onData) {
  return watchCollection('bookings', onData)
}

// Generic realtime collection listener. Returns an unsubscribe function.
export function watchCollection(name, onData) {
  if (!db) return () => {}
  return onSnapshot(collection(db, name), (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}
