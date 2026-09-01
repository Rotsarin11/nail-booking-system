// Single data-access layer. Switches between the live API and bundled
// mock data based on VITE_API_URL, so pages/context never branch on it.
import { api, API_ENABLED } from './api.js'
import * as mock from '../data/mockData.js'
import { blockMinutes, minToTime, qualifiedStaff, slotsForAny, slotsForStaff, timeToMin, upcomingDays } from './slots.js'

export { API_ENABLED }

// In-memory booking store for the offline/mock path (persists per session).
let mockBookings = mock.bookings.map((b) => ({ ...b }))

const todayKey = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// The signed-in customer. With LIFF this will come from the LINE profile;
// for now it's the mock customer (same id the API expects as userId).
export const currentUser = mock.currentUser
export const shop = mock.shop

// ── Catalog ─────────────────────────────────────────────────────────
export async function loadCatalog() {
  if (API_ENABLED) {
    const [services, staff, closures] = await Promise.all([
      api.getServices(), api.getStaff(), api.getShopClosures(),
    ])
    return { services, staff, closures, shop, currentUser }
  }
  return {
    services: mock.services.filter((s) => s.isActive !== false),
    staff: mock.staff,
    closures: mock.closures,
    shop, currentUser,
  }
}

export async function loadMyBookings(userId) {
  if (API_ENABLED) return api.getBookings(userId)
  return mockBookings.filter((b) => b.userId === userId)
}

// ── Availability ────────────────────────────────────────────────────
// ctx = { staff, closures } (needed for the mock path)
export async function getAvailability({ date, serviceIds, staffId }, ctx) {
  if (API_ENABLED) {
    const { slots } = await api.getAvailability({ date, serviceIds, staffId })
    return slots
  }
  const chosen = serviceIds.map((id) => ctx.services.find((s) => s.id === id)).filter(Boolean)
  const block = blockMinutes(chosen)
  const eligible = qualifiedStaff(ctx.staff, serviceIds)
  const slotCtx = { bookings: mockBookings, closures: ctx.closures, today: todayKey() }
  if (staffId === 'any') return slotsForAny(eligible, date, block, slotCtx)
  const st = ctx.staff.find((s) => s.id === staffId)
  return slotsForStaff(st, date, block, slotCtx)
}

export function daysStrip(count, closures) {
  return upcomingDays(count, { closures, today: todayKey() })
}

// ── Create / cancel ─────────────────────────────────────────────────
// draft = { serviceIds, staffId, date, time, note }
export async function createBooking(draft, ctx) {
  const chosen = draft.serviceIds.map((id) => ctx.services.find((s) => s.id === id)).filter(Boolean)
  if (API_ENABLED) {
    return api.createBooking({
      userId: currentUser.id,
      userName: currentUser.fullName,
      serviceIds: draft.serviceIds,
      staffId: draft.staffId,
      date: draft.date,
      time: draft.time,
      note: draft.note,
    })
  }
  // mock: assign staff, compute end, persist in memory
  const block = blockMinutes(chosen)
  const eligible = qualifiedStaff(ctx.staff, draft.serviceIds)
  let staffId = draft.staffId
  if (staffId === 'any') {
    const slot = slotsForAny(eligible, draft.date, block, { bookings: mockBookings, closures: ctx.closures, today: todayKey() })
      .find((s) => s.time === draft.time)
    staffId = slot?.staffIds?.[0] || eligible[0]?.id
  }
  const st = ctx.staff.find((s) => s.id === staffId)
  const items = chosen.map((s) => ({ serviceId: s.id, name: s.name, priceSnapshot: s.price, durationSnapshot: s.durationMin }))
  const booking = {
    id: 'bk_' + Date.now(),
    userId: currentUser.id, userName: currentUser.fullName,
    staffId, staffName: st ? st.fullName : 'ไม่ระบุ',
    bookingDate: draft.date, startTime: draft.time,
    endTime: minToTime(timeToMin(draft.time) + block),
    status: 'pending', note: draft.note,
    totalPrice: items.reduce((s, it) => s + it.priceSnapshot, 0),
    items, result: null, createdAt: todayKey(),
  }
  mockBookings = [booking, ...mockBookings]
  return booking
}

export async function cancelBooking(id) {
  if (API_ENABLED) return api.cancelBooking(id)
  mockBookings = mockBookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
  return mockBookings.find((b) => b.id === id)
}
