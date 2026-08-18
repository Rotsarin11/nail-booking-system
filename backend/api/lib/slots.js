// ── Slot-availability algorithm (server-authoritative) ──────────────
// Mirrors the customer app's client-side algorithm, but this copy is the
// source of truth: the booking transaction re-checks availability here
// before writing, so two clients can never grab the same slot.

const STEP = 30 // slot granularity (minutes)

// Shop opening bounds (a booking's block must fit inside these hours).
const SHOP = { openHour: 10, closeHour: 19 }

const timeToMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const minToTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

// Total minutes a set of services occupies the chair (service + buffer).
// `services` is a map id -> { durationMin, bufferMin }.
function blockMinutes(serviceIds, servicesById) {
  return serviceIds.reduce((sum, id) => {
    const s = servicesById[id]
    return sum + (s ? (s.durationMin || 0) + (s.bufferMin || 0) : 0)
  }, 0)
}

const overlaps = (aS, aE, bS, bE) => aS < bE && bS < aE

// Busy intervals for one staff on a date, from active bookings.
function busyIntervals(bookings, staffId, dateKey) {
  return bookings
    .filter(
      (b) =>
        b.staffId === staffId &&
        b.bookingDate === dateKey &&
        !['cancelled', 'no_show'].includes(b.status),
    )
    .map((b) => [timeToMin(b.startTime), timeToMin(b.endTime)])
}

// Is the shop closed, or this staff on leave, that day?
function isClosed(closures, staffId, dateKey) {
  const shopClosed = closures.some((c) => c.closureDate === dateKey && !c.staffId)
  if (shopClosed) return true
  return closures.some((c) => c.closureDate === dateKey && c.staffId === staffId)
}

// Working window (minutes) for a staff on the weekday of dateKey,
// intersected with shop hours. Returns [start, end] or null (day off).
function workingWindow(staffMember, dateKey) {
  const wd = new Date(dateKey + 'T00:00:00').getDay()
  const sched = staffMember.schedule?.[String(wd)]
  if (!sched) return null
  const start = Math.max(timeToMin(sched.start), SHOP.openHour * 60)
  const end = Math.min(timeToMin(sched.end), SHOP.closeHour * 60)
  return end > start ? [start, end] : null
}

// Free start times for ONE staff member.
function slotsForStaff(staffMember, dateKey, block, bookings, closures, todayKey) {
  if (!staffMember || !block) return []
  if (isClosed(closures, staffMember.id, dateKey)) return []
  const win = workingWindow(staffMember, dateKey)
  if (!win) return []
  const [winStart, winEnd] = win
  const busy = busyIntervals(bookings, staffMember.id, dateKey)
  const nowMin =
    dateKey === todayKey ? new Date().getHours() * 60 + new Date().getMinutes() : -1

  const out = []
  for (let s = winStart; s + block <= winEnd; s += STEP) {
    const e = s + block
    const conflict = busy.some(([bS, bE]) => overlaps(s, e, bS, bE))
    const past = s <= nowMin
    out.push({ time: minToTime(s), endTime: minToTime(e), available: !conflict && !past })
  }
  return out
}

// Merged availability across every qualified active staff ("ไม่ระบุช่าง").
function slotsForAny(qualified, dateKey, block, bookings, closures, todayKey) {
  const map = new Map()
  qualified.forEach((st) => {
    slotsForStaff(st, dateKey, block, bookings, closures, todayKey).forEach((slot) => {
      const cur =
        map.get(slot.time) || { time: slot.time, endTime: slot.endTime, available: false, staffIds: [] }
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
function qualifiedStaff(allStaff, serviceIds) {
  return allStaff.filter(
    (st) => st.status === 'active' && serviceIds.every((sid) => (st.serviceIds || []).includes(sid)),
  )
}

module.exports = {
  STEP, SHOP, timeToMin, minToTime, blockMinutes, overlaps,
  slotsForStaff, slotsForAny, qualifiedStaff, workingWindow, isClosed,
}
