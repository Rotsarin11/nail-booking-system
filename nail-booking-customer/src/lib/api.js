// Thin fetch client for the booking API.
// Enabled only when VITE_API_URL is set; otherwise the app runs on bundled
// mock data (see dataSource.js) so the UI still works offline / for demos.
const BASE = import.meta.env.VITE_API_URL || ''
export const API_ENABLED = Boolean(BASE)

async function req(path, options) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { msg = (await res.json()).error || msg } catch { /* ignore */ }
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  getServices: () => req('/api/services'),
  getStaff: () => req('/api/staff'),
  getShopClosures: () => req('/api/shop-closures'),
  getAvailability: ({ date, serviceIds, staffId }) =>
    req(`/api/availability?date=${date}&serviceIds=${serviceIds.join(',')}&staffId=${staffId || 'any'}`),
  getBookings: (userId) => req(`/api/bookings?userId=${encodeURIComponent(userId)}`),
  createBooking: (payload) => req('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  cancelBooking: (id) => req(`/api/bookings/${id}/cancel`, { method: 'POST' }),
}
