/**
 * Take Care Nail — Booking API (Express + Firestore Admin)
 * ------------------------------------------------------------------
 * The authoritative booking service. Reads services/staff/bookings from
 * Firestore, computes slot availability, and creates bookings inside a
 * Firestore transaction that re-checks the slot — so two customers can
 * never grab the same time with the same staff (คิวชน).
 *
 *   npm install
 *   npm run start        (or: npm run dev)
 *
 * Requires a Firebase service-account key (see lib/firebase.js).
 */
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { db, FieldValue } = require('./lib/firebase')
const slots = require('./lib/slots')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000
const todayKey = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const ACTIVE = ['pending', 'confirmed'] // statuses that occupy a chair
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(req.method, req.path, '→', e.message)
  res.status(e.status || 500).json({ error: e.message || 'internal error' })
})

// ── Firestore readers ───────────────────────────────────────────────
async function getServices() {
  const snap = await db.collection('services').get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
async function getStaff() {
  const snap = await db.collection('staff').get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
async function getClosures() {
  const snap = await db.collection('shopClosures').get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
async function getBookings() {
  const snap = await db.collection('bookings').get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
const servicesMap = (list) => Object.fromEntries(list.map((s) => [s.id, s]))

// ── Health ──────────────────────────────────────────────────────────
app.get('/api/health', wrap(async (_req, res) => {
  res.json({ ok: true, project: require('./lib/firebase').projectId, time: new Date().toISOString() })
}))

// ── Catalog reads ───────────────────────────────────────────────────
app.get('/api/services', wrap(async (_req, res) => {
  const list = (await getServices()).filter((s) => s.isActive !== false)
  res.json(list)
}))
app.get('/api/staff', wrap(async (_req, res) => {
  res.json(await getStaff())
}))
app.get('/api/shop-closures', wrap(async (_req, res) => {
  res.json(await getClosures())
}))

// ── Availability ────────────────────────────────────────────────────
// GET /api/availability?date=YYYY-MM-DD&serviceIds=a,b&staffId=any|<id>
app.get('/api/availability', wrap(async (req, res) => {
  const { date, staffId = 'any' } = req.query
  const serviceIds = String(req.query.serviceIds || '').split(',').filter(Boolean)
  if (!date || serviceIds.length === 0) {
    return res.status(400).json({ error: 'ต้องระบุ date และ serviceIds' })
  }
  const [services, staff, bookings, closures] = await Promise.all([
    getServices(), getStaff(), getBookings(), getClosures(),
  ])
  const block = slots.blockMinutes(serviceIds, servicesMap(services))
  const eligible = slots.qualifiedStaff(staff, serviceIds)

  let result
  if (staffId === 'any') {
    result = slots.slotsForAny(eligible, date, block, bookings, closures, todayKey())
  } else {
    const st = staff.find((s) => s.id === staffId)
    result = slots.slotsForStaff(st, date, block, bookings, closures, todayKey())
  }
  res.json({ block, slots: result })
}))

// ── Bookings list ───────────────────────────────────────────────────
// GET /api/bookings?userId=<id>   → a customer's bookings
// GET /api/bookings?scope=admin   → all bookings (owner dashboard)
app.get('/api/bookings', wrap(async (req, res) => {
  const { userId, scope } = req.query
  let list = await getBookings()
  if (scope !== 'admin') {
    if (!userId) return res.status(400).json({ error: 'ต้องระบุ userId หรือ scope=admin' })
    list = list.filter((b) => b.userId === userId)
  }
  list.sort((a, b) => (b.bookingDate + b.startTime).localeCompare(a.bookingDate + a.startTime))
  res.json(list)
}))

app.get('/api/bookings/:id', wrap(async (req, res) => {
  const doc = await db.collection('bookings').doc(req.params.id).get()
  if (!doc.exists) return res.status(404).json({ error: 'ไม่พบการจอง' })
  res.json({ id: doc.id, ...doc.data() })
}))

// ── Create booking (transaction-guarded) ────────────────────────────
// POST /api/bookings { userId, userName, phone?, serviceIds[], staffId, date, time, note? }
app.post('/api/bookings', wrap(async (req, res) => {
  const { userId, userName, serviceIds, staffId = 'any', date, time, note = '' } = req.body || {}
  if (!userId || !Array.isArray(serviceIds) || !serviceIds.length || !date || !time) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบ (userId, serviceIds, date, time)' })
  }

  const [services, staff, closures] = await Promise.all([getServices(), getStaff(), getClosures()])
  const sMap = servicesMap(services)
  const block = slots.blockMinutes(serviceIds, sMap)
  const startMin = slots.timeToMin(time)
  const endMin = startMin + block
  const endTime = slots.minToTime(endMin)

  const eligible = slots.qualifiedStaff(staff, serviceIds)
  if (!eligible.length) return res.status(409).json({ error: 'ไม่มีช่างที่ให้บริการครบทุกรายการ' })

  // candidate staff order: specific pick, else all eligible (auto-assign)
  const candidates = staffId === 'any' ? eligible : eligible.filter((s) => s.id === staffId)
  if (!candidates.length) return res.status(409).json({ error: 'ช่างที่เลือกให้บริการไม่ครบ' })

  // window / closure sanity (fast fail before the transaction)
  const openOk = startMin >= slots.SHOP.openHour * 60 && endMin <= slots.SHOP.closeHour * 60
  if (!openOk) return res.status(409).json({ error: 'เวลาที่เลือกอยู่นอกเวลาทำการ' })

  const items = serviceIds.map((id) => ({
    serviceId: id,
    name: sMap[id]?.name || '',
    priceSnapshot: sMap[id]?.price || 0,
    durationSnapshot: sMap[id]?.durationMin || 0,
  }))
  const totalPrice = items.reduce((s, it) => s + it.priceSnapshot, 0)

  // Transaction: re-check the slot for each candidate, book the first free one.
  const bookingsCol = db.collection('bookings')
  const created = await db.runTransaction(async (t) => {
    for (const st of candidates) {
      if (slots.isClosed(closures, st.id, date)) continue
      const win = slots.workingWindow(st, date)
      if (!win || startMin < win[0] || endMin > win[1]) continue

      // read this staff's active bookings for the date INSIDE the transaction
      const q = bookingsCol.where('staffId', '==', st.id).where('bookingDate', '==', date)
      const snap = await t.get(q)
      const clash = snap.docs.some((d) => {
        const b = d.data()
        if (!ACTIVE.includes(b.status)) return false
        return slots.overlaps(startMin, endMin, slots.timeToMin(b.startTime), slots.timeToMin(b.endTime))
      })
      if (clash) continue

      const ref = bookingsCol.doc()
      const booking = {
        userId, userName: userName || 'ลูกค้า',
        staffId: st.id, staffName: st.fullName,
        bookingDate: date, startTime: time, endTime,
        status: 'pending', note, totalPrice, items,
        result: null, createdAt: FieldValue.serverTimestamp(),
      }
      t.set(ref, booking)
      return { id: ref.id, ...booking, createdAt: new Date().toISOString() }
    }
    const err = new Error('ช่วงเวลานี้เพิ่งถูกจองไปแล้ว กรุณาเลือกเวลาอื่น')
    err.status = 409
    throw err
  })

  res.status(201).json(created)
}))

// ── Update status (admin) ───────────────────────────────────────────
// PATCH /api/bookings/:id { status, result? }
app.patch('/api/bookings/:id', wrap(async (req, res) => {
  const { status, result, cancelReason } = req.body || {}
  const allowed = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
  if (!allowed.includes(status)) return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' })
  // Cancelling must carry a reason (international best practice: auditable).
  if (status === 'cancelled' && !String(cancelReason || '').trim()) {
    return res.status(400).json({ error: 'ต้องระบุเหตุผลในการยกเลิก' })
  }
  const ref = db.collection('bookings').doc(req.params.id)
  const doc = await ref.get()
  if (!doc.exists) return res.status(404).json({ error: 'ไม่พบการจอง' })

  const patch = { status }
  if (status === 'completed') {
    patch.result = result || { status: 'done', completedAt: new Date().toISOString(), note: '', detail: '' }
  }
  if (status === 'cancelled') {
    patch.cancelReason = String(cancelReason).trim()
    patch.cancelledBy = 'admin'
    patch.cancelledAt = new Date().toISOString()
  }
  await ref.update(patch)
  res.json({ id: ref.id, ...doc.data(), ...patch })
}))

// ── Cancel (customer) ───────────────────────────────────────────────
app.post('/api/bookings/:id/cancel', wrap(async (req, res) => {
  const ref = db.collection('bookings').doc(req.params.id)
  const doc = await ref.get()
  if (!doc.exists) return res.status(404).json({ error: 'ไม่พบการจอง' })
  const patch = {
    status: 'cancelled',
    cancelReason: String(req.body?.cancelReason || 'ลูกค้ายกเลิกเอง').trim(),
    cancelledBy: 'customer',
    cancelledAt: new Date().toISOString(),
  }
  await ref.update(patch)
  res.json({ id: ref.id, ...doc.data(), ...patch })
}))

// ════════════════════════════════════════════════════════════════════
//  ADMIN MANAGEMENT — CRUD for the catalog collections
// ════════════════════════════════════════════════════════════════════
const num = (v, d = 0) => (v === '' || v == null || isNaN(Number(v)) ? d : Number(v))
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

// ── Services ────────────────────────────────────────────────────────
app.post('/api/services', wrap(async (req, res) => {
  const b = req.body || {}
  if (!b.name) return res.status(400).json({ error: 'ต้องระบุชื่อบริการ' })
  const data = clean({
    name: b.name, category: b.category || 'ทั่วไป', description: b.description || '',
    durationMin: num(b.durationMin, 30), bufferMin: num(b.bufferMin, 0), price: num(b.price, 0),
    isActive: b.isActive !== false, createdAt: FieldValue.serverTimestamp(),
  })
  const ref = await db.collection('services').add(data)
  res.status(201).json({ id: ref.id, ...data })
}))
app.patch('/api/services/:id', wrap(async (req, res) => {
  const b = req.body || {}
  const patch = clean({
    name: b.name, category: b.category, description: b.description,
    durationMin: b.durationMin != null ? num(b.durationMin) : undefined,
    bufferMin: b.bufferMin != null ? num(b.bufferMin) : undefined,
    price: b.price != null ? num(b.price) : undefined,
    isActive: b.isActive,
  })
  await db.collection('services').doc(req.params.id).update(patch)
  res.json({ id: req.params.id, ...patch })
}))
app.delete('/api/services/:id', wrap(async (req, res) => {
  await db.collection('services').doc(req.params.id).delete()
  res.json({ ok: true })
}))

// ── Staff ───────────────────────────────────────────────────────────
app.post('/api/staff', wrap(async (req, res) => {
  const b = req.body || {}
  if (!b.fullName) return res.status(400).json({ error: 'ต้องระบุชื่อช่าง' })
  const data = clean({
    fullName: b.fullName, nickname: b.nickname || b.fullName?.slice(0, 1), phone: b.phone || '',
    specialty: b.specialty || '', status: b.status === 'inactive' ? 'inactive' : 'active',
    serviceIds: Array.isArray(b.serviceIds) ? b.serviceIds : [],
    schedule: b.schedule || {}, createdAt: FieldValue.serverTimestamp(),
  })
  const ref = await db.collection('staff').add(data)
  res.status(201).json({ id: ref.id, ...data })
}))
app.patch('/api/staff/:id', wrap(async (req, res) => {
  const b = req.body || {}
  const patch = clean({
    fullName: b.fullName, nickname: b.nickname, phone: b.phone, specialty: b.specialty,
    status: b.status, serviceIds: Array.isArray(b.serviceIds) ? b.serviceIds : undefined,
    schedule: b.schedule,
  })
  await db.collection('staff').doc(req.params.id).update(patch)
  res.json({ id: req.params.id, ...patch })
}))
app.delete('/api/staff/:id', wrap(async (req, res) => {
  await db.collection('staff').doc(req.params.id).delete()
  res.json({ ok: true })
}))

// ── Shop closures (holidays + staff leave) ──────────────────────────
app.post('/api/shop-closures', wrap(async (req, res) => {
  const b = req.body || {}
  if (!b.closureDate) return res.status(400).json({ error: 'ต้องระบุวันที่' })
  const data = clean({
    closureDate: b.closureDate, staffId: b.staffId || null, reason: b.reason || '',
    createdAt: FieldValue.serverTimestamp(),
  })
  const ref = await db.collection('shopClosures').add(data)
  res.status(201).json({ id: ref.id, ...data })
}))
app.delete('/api/shop-closures/:id', wrap(async (req, res) => {
  await db.collection('shopClosures').doc(req.params.id).delete()
  res.json({ ok: true })
}))

// ── Customers (users with role=customer + derived stats) ────────────
app.get('/api/customers', wrap(async (_req, res) => {
  const [usersSnap, bookings] = await Promise.all([
    db.collection('users').where('role', '==', 'customer').get(),
    getBookings(),
  ])
  const byUser = (uid, uname) => bookings.filter((b) => b.userId === uid || b.userName === uname)
  const list = usersSnap.docs.map((d) => {
    const u = { id: d.id, ...d.data() }
    const own = byUser(u.id, u.fullName)
    const done = own.filter((b) => b.status === 'completed')
    return {
      id: u.id, fullName: u.fullName || '', phone: u.phone || '', lineUserId: u.lineUserId || null,
      visits: done.length,
      totalSpend: done.reduce((s, b) => s + (b.totalPrice || 0), 0),
      lastVisit: own.map((b) => b.bookingDate).sort().at(-1) || null,
      upcoming: own.filter((b) => ['pending', 'confirmed'].includes(b.status)).length,
    }
  })
  list.sort((a, b) => b.totalSpend - a.totalSpend)
  res.json(list)
}))

// ── Shop settings (single doc) ──────────────────────────────────────
app.get('/api/settings', wrap(async (_req, res) => {
  const doc = await db.collection('settings').doc('shop').get()
  res.json(doc.exists ? { id: 'shop', ...doc.data() } : {})
}))
app.put('/api/settings', wrap(async (req, res) => {
  const data = clean({ ...req.body, updatedAt: FieldValue.serverTimestamp() })
  await db.collection('settings').doc('shop').set(data, { merge: true })
  res.json({ id: 'shop', ...req.body })
}))

app.listen(PORT, () => {
  console.log(`✅ Booking API listening on http://localhost:${PORT}`)
})
