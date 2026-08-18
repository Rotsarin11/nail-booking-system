// Firestore realtime (read-only) for the customer app.
// Writes still go through the backend API; this only *listens* for changes.
// Enabled when the Firebase web config is present in env; otherwise the app
// falls back to API polling (see BookingContext).
import { initializeApp } from 'firebase/app'
import { collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore'

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

// Subscribe to one customer's bookings. Returns an unsubscribe function.
export function watchMyBookings(userId, onData) {
  if (!db || !userId) return () => {}
  const q = query(collection(db, 'bookings'), where('userId', '==', userId))
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// Subscribe to a whole collection (services / staff / shopClosures) realtime.
export function watchCollection(name, onData) {
  if (!db) return () => {}
  return onSnapshot(collection(db, name), (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
