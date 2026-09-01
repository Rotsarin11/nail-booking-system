import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, API_ENABLED } from '../lib/api.js'
import { FIREBASE_ENABLED, watchAllBookings, watchCollection } from '../lib/firebaseClient.js'
import { bookings as mockBookings, staff as mockStaff, services as mockServices, closures as mockClosures } from '../data/mockData.js'

// Shared live-data context for the whole admin dashboard.
// Reads are realtime (Firestore onSnapshot) or API-polled; every write goes
// through the backend API. The bell reflects all pending bookings the admin
// has not yet reviewed (inbox-style, persisted across refreshes).
const DataContext = createContext(null)
export const useData = () => useContext(DataContext)
const LIVE = API_ENABLED || FIREBASE_ENABLED

const READ_KEY = 'nb_read_bookings'
const loadRead = () => { try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')) } catch { return new Set() } }
const tsOf = (b) => (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : new Date((b.bookingDate || '') + 'T00:00:00').getTime())

export function DataProvider({ children }) {
  const [bookings, setBookings] = useState(LIVE ? [] : mockBookings)
  const [services, setServices] = useState(LIVE ? [] : mockServices)
  const [staff, setStaff] = useState(LIVE ? [] : mockStaff)
  const [closures, setClosures] = useState(LIVE ? [] : mockClosures)
  const [customers, setCustomers] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(LIVE)
  const [error, setError] = useState(null)
  const [readIds, setReadIds] = useState(loadRead)

  // ── loaders (API path / manual refresh) ──
  const loadBookings = async () => { if (API_ENABLED) setBookings(await api.getBookings()) }
  const loadServices = async () => { if (API_ENABLED) setServices(await api.getServices()) }
  const loadStaff = async () => { if (API_ENABLED) setStaff(await api.getStaff()) }
  const loadClosures = async () => { if (API_ENABLED) setClosures(await api.getClosures()) }
  const loadCustomers = async () => { if (API_ENABLED) setCustomers(await api.getCustomers()) }
  const loadSettings = async () => { if (API_ENABLED) setSettings(await api.getSettings()) }

  useEffect(() => {
    if (!LIVE) return
    let unsub = []
    ;(async () => {
      try {
        if (FIREBASE_ENABLED) {
          unsub.push(watchAllBookings((rows) => { setBookings(rows); setLoading(false) }))
          unsub.push(watchCollection('services', setServices))
          unsub.push(watchCollection('staff', setStaff))
          unsub.push(watchCollection('shopClosures', setClosures))
          await Promise.all([loadCustomers(), loadSettings()])
        } else {
          await Promise.all([loadBookings(), loadServices(), loadStaff(), loadClosures(), loadCustomers(), loadSettings()])
          setLoading(false)
        }
      } catch (e) { setError(e.message); setLoading(false) }
    })()

    const onFocus = () => { if (!FIREBASE_ENABLED) loadBookings(); loadCustomers() }
    const timer = FIREBASE_ENABLED ? null : setInterval(() => { loadBookings() }, 8000)
    window.addEventListener('focus', onFocus)
    return () => {
      unsub.forEach((u) => u && u())
      if (timer) clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── notifications = pending bookings awaiting action (inbox style) ──
  const notifications = useMemo(
    () => bookings
      .filter((b) => b.status === 'pending')
      .sort((a, b) => tsOf(b) - tsOf(a))
      .map((b) => ({
        id: b.id, userName: b.userName,
        services: (b.items || []).map((i) => i.name).join(' · '),
        bookingDate: b.bookingDate, startTime: b.startTime, totalPrice: b.totalPrice, at: tsOf(b),
      })),
    [bookings],
  )
  const unread = useMemo(() => notifications.filter((n) => !readIds.has(n.id)).length, [notifications, readIds])
  const markNotificationsRead = () => {
    const next = new Set(readIds)
    notifications.forEach((n) => next.add(n.id))
    setReadIds(next)
    try { localStorage.setItem(READ_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
  }

  // ── bookings mutations ──
  // opts.cancelReason is required by the API when status === 'cancelled'.
  const updateStatus = async (id, status, opts = {}) => {
    const extra = status === 'cancelled'
      ? { cancelReason: opts.cancelReason, cancelledBy: 'admin', cancelledAt: new Date().toISOString() }
      : {}
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status, ...extra } : b)))
    if (!API_ENABLED) return
    try {
      await api.setStatus(id, status, status === 'cancelled' ? { cancelReason: opts.cancelReason } : {})
      loadCustomers()
    } catch (e) { setError(e.message); loadBookings() }
  }

  // ── services mutations ──
  const saveService = async (id, data) => { if (!API_ENABLED) return; if (id) await api.updateService(id, data); else await api.createService(data); if (!FIREBASE_ENABLED) loadServices() }
  const deleteService = async (id) => { if (!API_ENABLED) return; await api.deleteService(id); if (!FIREBASE_ENABLED) loadServices() }

  // ── staff mutations ──
  const saveStaff = async (id, data) => { if (!API_ENABLED) return; if (id) await api.updateStaff(id, data); else await api.createStaff(data); if (!FIREBASE_ENABLED) loadStaff() }
  const deleteStaff = async (id) => { if (!API_ENABLED) return; await api.deleteStaff(id); if (!FIREBASE_ENABLED) loadStaff() }

  // ── closures mutations ──
  const addClosure = async (data) => { if (!API_ENABLED) return; await api.createClosure(data); if (!FIREBASE_ENABLED) loadClosures() }
  const removeClosure = async (id) => { if (!API_ENABLED) return; await api.deleteClosure(id); if (!FIREBASE_ENABLED) loadClosures() }

  // ── settings ──
  const saveSettings = async (data) => { setSettings((s) => ({ ...s, ...data })); if (API_ENABLED) await api.saveSettings(data) }

  return (
    <DataContext.Provider value={{
      bookings, services, staff, closures, customers, settings, loading, error, apiEnabled: API_ENABLED,
      notifications, unread, markNotificationsRead,
      reload: loadBookings, refreshCustomers: loadCustomers,
      updateStatus, saveService, deleteService, saveStaff, deleteStaff, addClosure, removeClosure, saveSettings,
    }}>
      {children}
    </DataContext.Provider>
  )
}
