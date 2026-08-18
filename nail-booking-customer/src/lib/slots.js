// ── Slot-availability algorithm (client, offline/mock path) ─────────
// Pure functions: all data is passed in, nothing is imported. When the
// API is enabled the server computes availability instead (see api.js);
// this mirrors the server algorithm for the offline/mock fallback.
// Closures use the Firestore shape: { closureDate, staffId } (staffId null = whole shop).

const STEP = 30
const SHOP = { openHour: 10, closeHour: 19 }

export const timeToMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const minToTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

// Minutes a set of chosen services occupies the chair (service + buffer).
export function blockMinutes(items) {
  return items.reduce(
    (sum, s) => sum + (s.durationMin || s.durationSnapshot || 0) + (s.bufferMin || 0),
    0,
  )
}

const overlaps = (aS, aE, bS, bE) => aS < bE && bS < aE

function busyIntervals(bookings, staffId, dateKey) {
  return bookings
    .filter(
      (b) => b.staffId === staffId && b.bookingDate === dateKey && !['cancelled', 'no_show'].includes(b.status),
    )
    .map((b) => [timeToMin(b.startTime), timeToMin(b.endTime)])
}

export function isClosed(closures, staffId, dateKey) {
  const shopClosed = closures.some((c) => c.closureDate === dateKey && !c.staffId)
  if (shopClosed) return { closed: true, reason: 'ร้านปิดในวันนี้' }
  const leave = closures.find((c) => c.closureDate === dateKey && c.staffId === staffId)
  if (leave) return { closed: true, reason: 'ช่างลาในวันนี้' }
  return { closed: false }
}

function workingWindow(staffMember, dateKey) {
  const wd = new Date(dateKey + 'T00:00:00').getDay()
  const sched = staffMember.schedule?.[String(wd)] || staffMember.schedule?.[wd]
  if (!sched) return null
  const start = Math.max(timeToMin(sched.start), SHOP.openHour * 60)
  const end = Math.min(timeToMin(sched.end), SHOP.closeHour * 60)
  return end > start ? [start, end] : null
}

// Free start times for ONE staff member.
export function slotsForStaff(staffMember, dateKey, block, { bookings, closures, today }) {
  if (!staffMember || !block) return []
  if (isClosed(closures, staffMember.id, dateKey).closed) return []
  const win = workingWindow(staffMember, dateKey)
  if (!win) return []
  const [winStart, winEnd] = win
  const busy = busyIntervals(bookings, staffMember.id, dateKey)
  const nowMin = dateKey === today ? new Date().getHours() * 60 + new Date().getMinutes() : -1

  const out = []
  for (let s = winStart; s + block <= winEnd; s += STEP) {
    const e = s + block
    const conflict = busy.some(([bS, bE]) => overlaps(s, e, bS, bE))
    out.push({ time: minToTime(s), endTime: minToTime(e), available: !conflict && s > nowMin })
  }
  return out
}

// Merged availability across every qualified active staff ("ไม่ระบุช่าง").
export function slotsForAny(qualified, dateKey, block, ctx) {
  const map = new Map()
  qualified.forEach((st) => {
    slotsForStaff(st, dateKey, block, ctx).forEach((slot) => {
      const cur = map.get(slot.time) || { time: slot.time, endTime: slot.endTime, available: false, staffIds: [] }
      if (slot.available) {
        cur.available = true
        cur.staffIds.push(st.id)
      }
      map.set(slot.time, cur)
    })
  })
  return Array.from(map.values()).sort((a, b) => timeToMin(a.time) - timeToMin(b.time))
}

// Staff who can perform ALL selected services and are active.
export function qualifiedStaff(allStaff, serviceIds) {
  return allStaff.filter(
    (st) => st.status === 'active' && serviceIds.every((sid) => (st.serviceIds || []).includes(sid)),
  )
}

// Next N days as calendar cells, flagging shop-wide closures.
export function upcomingDays(count, { closures, today }) {
  const out = []
  const base = new Date(today + 'T00:00:00')
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const shopClosed = closures.some((c) => c.closureDate === key && !c.staffId)
    out.push({ key, day: d.getDate(), weekday: d.getDay(), shopClosed })
  }
  return out
}
