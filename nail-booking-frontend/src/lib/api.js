// Fetch client for the booking API (admin side).
// Enabled only when VITE_API_URL is set; otherwise the dashboard runs on
// bundled mock data so the UI keeps working offline.
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
const body = (data) => JSON.stringify(data)

export const api = {
  // bookings
  getBookings: () => req('/api/bookings?scope=admin'),
  setStatus: (id, status, extra = {}) => req(`/api/bookings/${id}`, { method: 'PATCH', body: body({ status, ...extra }) }),
  cancel: (id) => req(`/api/bookings/${id}/cancel`, { method: 'POST' }),
  // catalog reads
  getServices: () => req('/api/services'),
  getStaff: () => req('/api/staff'),
  getClosures: () => req('/api/shop-closures'),
  getCustomers: () => req('/api/customers'),
  getSettings: () => req('/api/settings'),
  // services CRUD
  createService: (d) => req('/api/services', { method: 'POST', body: body(d) }),
  updateService: (id, d) => req(`/api/services/${id}`, { method: 'PATCH', body: body(d) }),
  deleteService: (id) => req(`/api/services/${id}`, { method: 'DELETE' }),
  // staff CRUD
  createStaff: (d) => req('/api/staff', { method: 'POST', body: body(d) }),
  updateStaff: (id, d) => req(`/api/staff/${id}`, { method: 'PATCH', body: body(d) }),
  deleteStaff: (id) => req(`/api/staff/${id}`, { method: 'DELETE' }),
  // closures
  createClosure: (d) => req('/api/shop-closures', { method: 'POST', body: body(d) }),
  deleteClosure: (id) => req(`/api/shop-closures/${id}`, { method: 'DELETE' }),
  // settings
  saveSettings: (d) => req('/api/settings', { method: 'PUT', body: body(d) }),
}
