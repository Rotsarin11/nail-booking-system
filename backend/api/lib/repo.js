// ── Data-access layer (MySQL / MariaDB) ──────────────────────────────
// Replaces the old Firestore reads/writes in server.js. Every function
// here returns/accepts the SAME camelCase JSON shapes the Firestore
// version used, so server.js's business logic (slots.js, validation,
// the booking-creation flow) and every existing frontend/customer call
// site keep working unmodified.
const { pool } = require('./db')
const slots = require('./slots')

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------
const str = (v) => (v == null ? v : String(v))
const dayKeyOf = (dateKey) => new Date(dateKey + 'T00:00:00').getDay()

function serviceRow(r) {
  return {
    id: str(r.service_id),
    name: r.name,
    category: r.category,
    description: r.description,
    durationMin: r.duration_min,
    bufferMin: r.buffer_min,
    price: Number(r.price),
    isActive: !!r.is_active,
  }
}

function closureRow(r) {
  return {
    id: str(r.closure_id),
    closureDate: r.closure_date,
    staffId: r.staff_id == null ? null : str(r.staff_id),
    reason: r.reason,
  }
}

// ---------------------------------------------------------------------
// services
// ---------------------------------------------------------------------
async function getServices() {
  const [rows] = await pool.query('SELECT * FROM services ORDER BY service_id')
  return rows.map(serviceRow)
}

async function createService(data) {
  const [r] = await pool.query(
    `INSERT INTO services (name, category, description, duration_min, buffer_min, price, is_active)
     VALUES (:name, :category, :description, :durationMin, :bufferMin, :price, :isActive)`,
    {
      name: data.name,
      category: data.category || 'ทั่วไป',
      description: data.description || '',
      durationMin: data.durationMin ?? 30,
      bufferMin: data.bufferMin ?? 0,
      price: data.price ?? 0,
      isActive: data.isActive !== false ? 1 : 0,
    },
  )
  const [[row]] = await pool.query('SELECT * FROM services WHERE service_id = ?', [r.insertId])
  return serviceRow(row)
}

async function updateService(id, patch) {
  const fields = []
  const params = { id }
  const map = {
    name: 'name', category: 'category', description: 'description',
    durationMin: 'duration_min', bufferMin: 'buffer_min', price: 'price', isActive: 'is_active',
  }
  for (const [key, col] of Object.entries(map)) {
    if (patch[key] !== undefined) {
      fields.push(`${col} = :${key}`)
      params[key] = key === 'isActive' ? (patch[key] ? 1 : 0) : patch[key]
    }
  }
  if (fields.length) {
    await pool.query(`UPDATE services SET ${fields.join(', ')} WHERE service_id = :id`, params)
  }
  const [[row]] = await pool.query('SELECT * FROM services WHERE service_id = ?', [id])
  return row ? serviceRow(row) : null
}

async function deleteService(id) {
  await pool.query('DELETE FROM services WHERE service_id = ?', [id])
}

// ---------------------------------------------------------------------
// staff (+ staff_service junction, + staff_schedule)
// ---------------------------------------------------------------------
async function getStaff() {
  const [staffRows] = await pool.query('SELECT * FROM staff ORDER BY staff_id')
  if (!staffRows.length) return []
  const ids = staffRows.map((r) => r.staff_id)
  const [svcRows] = await pool.query(
    `SELECT staff_id, service_id FROM staff_service WHERE staff_id IN (?)`,
    [ids],
  )
  const [schedRows] = await pool.query(
    `SELECT staff_id, day_of_week, start_time, end_time FROM staff_schedule WHERE staff_id IN (?)`,
    [ids],
  )
  const svcByStaff = new Map()
  svcRows.forEach((r) => {
    const list = svcByStaff.get(r.staff_id) || []
    list.push(str(r.service_id))
    svcByStaff.set(r.staff_id, list)
  })
  const schedByStaff = new Map()
  schedRows.forEach((r) => {
    const obj = schedByStaff.get(r.staff_id) || {}
    obj[String(r.day_of_week)] = { start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) }
    schedByStaff.set(r.staff_id, obj)
  })
  return staffRows.map((r) => ({
    id: str(r.staff_id),
    fullName: r.full_name,
    nickname: r.nickname,
    phone: r.phone,
    specialty: r.specialty,
    status: r.status,
    serviceIds: svcByStaff.get(r.staff_id) || [],
    schedule: schedByStaff.get(r.staff_id) || {},
  }))
}

async function replaceStaffServices(conn, staffId, serviceIds) {
  await conn.query('DELETE FROM staff_service WHERE staff_id = ?', [staffId])
  if (serviceIds.length) {
    const values = serviceIds.map((sid) => [staffId, Number(sid)])
    await conn.query('INSERT INTO staff_service (staff_id, service_id) VALUES ?', [values])
  }
}

async function replaceStaffSchedule(conn, staffId, schedule) {
  await conn.query('DELETE FROM staff_schedule WHERE staff_id = ?', [staffId])
  const days = Object.keys(schedule || {})
  if (days.length) {
    const values = days.map((d) => [staffId, Number(d), schedule[d].start, schedule[d].end])
    await conn.query(
      'INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES ?',
      [values],
    )
  }
}

async function createStaff(data) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [r] = await conn.query(
      `INSERT INTO staff (full_name, nickname, phone, specialty, status)
       VALUES (:fullName, :nickname, :phone, :specialty, :status)`,
      {
        fullName: data.fullName,
        nickname: data.nickname || data.fullName?.slice(0, 1) || '',
        phone: data.phone || '',
        specialty: data.specialty || '',
        status: data.status === 'inactive' ? 'inactive' : 'active',
      },
    )
    const staffId = r.insertId
    await replaceStaffServices(conn, staffId, Array.isArray(data.serviceIds) ? data.serviceIds : [])
    await replaceStaffSchedule(conn, staffId, data.schedule || {})
    await conn.commit()
    return staffId
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

async function updateStaff(id, patch) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const fields = []
    const params = { id }
    const map = { fullName: 'full_name', nickname: 'nickname', phone: 'phone', specialty: 'specialty', status: 'status' }
    for (const [key, col] of Object.entries(map)) {
      if (patch[key] !== undefined) {
        fields.push(`${col} = :${key}`)
        params[key] = patch[key]
      }
    }
    if (fields.length) {
      await conn.query(`UPDATE staff SET ${fields.join(', ')} WHERE staff_id = :id`, params)
    }
    if (Array.isArray(patch.serviceIds)) await replaceStaffServices(conn, id, patch.serviceIds)
    if (patch.schedule) await replaceStaffSchedule(conn, id, patch.schedule)
    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

async function deleteStaff(id) {
  await pool.query('DELETE FROM staff WHERE staff_id = ?', [id])
}

// ---------------------------------------------------------------------
// shop closures
// ---------------------------------------------------------------------
async function getClosures() {
  const [rows] = await pool.query('SELECT * FROM shop_closure ORDER BY closure_date')
  return rows.map(closureRow)
}

async function createClosure(data) {
  const [r] = await pool.query(
    'INSERT INTO shop_closure (closure_date, staff_id, reason) VALUES (:closureDate, :staffId, :reason)',
    { closureDate: data.closureDate, staffId: data.staffId || null, reason: data.reason || '' },
  )
  const [[row]] = await pool.query('SELECT * FROM shop_closure WHERE closure_id = ?', [r.insertId])
  return closureRow(row)
}

async function deleteClosure(id) {
  await pool.query('DELETE FROM shop_closure WHERE closure_id = ?', [id])
}

// ---------------------------------------------------------------------
// bookings (+ booking_items, + service_results, + users/staff names)
// ---------------------------------------------------------------------
async function attachItemsAndResults(bookingRows) {
  if (!bookingRows.length) return []
  const ids = bookingRows.map((r) => r.booking_id)
  const [itemRows] = await pool.query(
    `SELECT bi.booking_id, bi.service_id, bi.price_snapshot, bi.duration_snapshot, s.name
     FROM booking_items bi JOIN services s ON s.service_id = bi.service_id
     WHERE bi.booking_id IN (?)`,
    [ids],
  )
  const [resultRows] = await pool.query(
    `SELECT * FROM service_results WHERE booking_id IN (?)`,
    [ids],
  )
  const itemsByBooking = new Map()
  itemRows.forEach((r) => {
    const list = itemsByBooking.get(r.booking_id) || []
    list.push({
      serviceId: str(r.service_id),
      name: r.name,
      priceSnapshot: Number(r.price_snapshot),
      durationSnapshot: r.duration_snapshot,
    })
    itemsByBooking.set(r.booking_id, list)
  })
  const resultByBooking = new Map()
  resultRows.forEach((r) => {
    resultByBooking.set(r.booking_id, {
      status: r.status,
      completedAt: r.completed_date ? `${r.completed_date}T${(r.completed_time || '00:00:00')}` : null,
      note: r.note || '',
      detail: r.result_detail || '',
    })
  })
  return bookingRows.map((r) => ({
    id: str(r.booking_id),
    userId: str(r.user_id),
    userName: r.user_name,
    staffId: str(r.staff_id),
    staffName: r.staff_name,
    bookingDate: r.booking_date,
    startTime: r.start_time.slice(0, 5),
    endTime: r.end_time.slice(0, 5),
    status: r.status,
    note: r.note || '',
    cancelReason: r.cancel_reason || null,
    cancelledBy: r.cancelled_by || null,
    cancelledAt: r.cancelled_at,
    totalPrice: (itemsByBooking.get(r.booking_id) || []).reduce((s, it) => s + it.priceSnapshot, 0),
    items: itemsByBooking.get(r.booking_id) || [],
    result: resultByBooking.get(r.booking_id) || null,
    createdAt: r.created_at,
  }))
}

const BOOKING_SELECT = `
  SELECT b.*, u.full_name AS user_name, st.full_name AS staff_name
  FROM bookings b
  JOIN users u ON u.user_id = b.user_id
  JOIN staff st ON st.staff_id = b.staff_id
`

async function getBookings() {
  const [rows] = await pool.query(`${BOOKING_SELECT} ORDER BY b.booking_date DESC, b.start_time DESC`)
  return attachItemsAndResults(rows)
}

async function getBookingById(id) {
  const [rows] = await pool.query(`${BOOKING_SELECT} WHERE b.booking_id = ?`, [id])
  const [full] = await attachItemsAndResults(rows)
  return full || null
}

// Look up (or create) the numeric `users` row for a customer identified by
// an external id (the LINE user id, in production; any stable string in
// mock/demo use) — this is what lets the API keep accepting a free-form
// `userId` from the client without requiring a pre-existing numeric id,
// exactly like the old Firestore version did.
async function upsertCustomerUser({ externalId, fullName, phone }) {
  await pool.query(
    `INSERT INTO users (role, full_name, phone, line_user_id)
     VALUES ('customer', :fullName, :phone, :externalId)
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       phone = COALESCE(NULLIF(VALUES(phone), ''), phone)`,
    { fullName: fullName || 'ลูกค้า', phone: phone || null, externalId },
  )
  const [[row]] = await pool.query('SELECT user_id FROM users WHERE line_user_id = ?', [externalId])
  return row.user_id
}

// The reverse of findUserNumericId: given the internal numeric user_id,
// return the external identifier (line_user_id) a client may have used to
// subscribe to its own Socket.IO room — needed because a booking mutation
// only carries the numeric id, while the browser only knows whatever id it
// originally used to create the booking (a LIFF numeric id, or the mock
// demo's fixed 'u_101' string, which gets stored as line_user_id).
async function getUserExternalId(numericId) {
  const [[row]] = await pool.query('SELECT line_user_id FROM users WHERE user_id = ?', [numericId])
  return row ? row.line_user_id : null
}

async function findUserNumericId(externalId) {
  // Accept either an already-numeric users.user_id, or an external
  // (line_user_id) identifier — whichever the caller happens to hold.
  if (/^\d+$/.test(String(externalId))) return Number(externalId)
  const [[row]] = await pool.query('SELECT user_id FROM users WHERE line_user_id = ?', [externalId])
  return row ? row.user_id : null
}

// Transaction-guarded booking creation — mirrors the old Firestore
// runTransaction loop, but uses a real SQL transaction with row locks
// (SELECT ... FOR UPDATE on the candidate staff's bookings for that date)
// so two concurrent requests can never double-book the same slot.
async function createBookingTx({ userId, userName, phone, serviceIds, staffId, date, time, note }) {
  const services = await getServices()
  const sMap = Object.fromEntries(services.map((s) => [s.id, s]))
  const staffList = await getStaff()
  const closures = await getClosures()

  const block = slots.blockMinutes(serviceIds, sMap)
  const startMin = slots.timeToMin(time)
  const endMin = startMin + block
  const endTime = slots.minToTime(endMin)

  const eligible = slots.qualifiedStaff(staffList, serviceIds)
  if (!eligible.length) { const e = new Error('ไม่มีช่างที่ให้บริการครบทุกรายการ'); e.status = 409; throw e }

  const candidates = staffId === 'any' ? eligible : eligible.filter((s) => s.id === staffId)
  if (!candidates.length) { const e = new Error('ช่างที่เลือกให้บริการไม่ครบ'); e.status = 409; throw e }

  const openOk = startMin >= slots.SHOP.openHour * 60 && endMin <= slots.SHOP.closeHour * 60
  if (!openOk) { const e = new Error('เวลาที่เลือกอยู่นอกเวลาทำการ'); e.status = 409; throw e }

  const userNumericId = await upsertCustomerUser({ externalId: userId, fullName: userName, phone })

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    let chosenStaffId = null
    for (const st of candidates) {
      if (slots.isClosed(closures, st.id, date)) continue
      const win = slots.workingWindow(st, date)
      if (!win || startMin < win[0] || endMin > win[1]) continue

      // Lock this staff's active bookings for the date so a concurrent
      // request for the same staff+date must wait behind this one.
      const [rows] = await conn.query(
        `SELECT start_time, end_time FROM bookings
         WHERE staff_id = ? AND booking_date = ? AND status IN ('pending','confirmed')
         FOR UPDATE`,
        [st.id, date],
      )
      const clash = rows.some((b) =>
        slots.overlaps(startMin, endMin, slots.timeToMin(b.start_time.slice(0, 5)), slots.timeToMin(b.end_time.slice(0, 5))),
      )
      if (clash) continue
      chosenStaffId = st.id
      break
    }

    if (!chosenStaffId) {
      const e = new Error('ช่วงเวลานี้เพิ่งถูกจองไปแล้ว กรุณาเลือกเวลาอื่น')
      e.status = 409
      throw e
    }

    const [r] = await conn.query(
      `INSERT INTO bookings (user_id, staff_id, booking_date, start_time, end_time, status, note)
       VALUES (:userId, :staffId, :date, :time, :endTime, 'pending', :note)`,
      { userId: userNumericId, staffId: chosenStaffId, date, time, endTime, note: note || '' },
    )
    const bookingId = r.insertId
    if (serviceIds.length) {
      const values = serviceIds.map((sid) => [
        bookingId, Number(sid), sMap[sid]?.price || 0, sMap[sid]?.durationMin || 0,
      ])
      await conn.query(
        'INSERT INTO booking_items (booking_id, service_id, price_snapshot, duration_snapshot) VALUES ?',
        [values],
      )
    }
    await conn.commit()
    return getBookingById(bookingId)
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

async function updateBookingStatus(id, { status, result, cancelReason }) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const params = { id, status }
    let sql = 'UPDATE bookings SET status = :status'
    if (status === 'cancelled') {
      sql += ', cancel_reason = :cancelReason, cancelled_by = :cancelledBy, cancelled_at = NOW()'
      params.cancelReason = String(cancelReason).trim()
      params.cancelledBy = 'admin'
    }
    sql += ' WHERE booking_id = :id'
    await conn.query(sql, params)

    if (status === 'completed') {
      const r = result || { status: 'done', note: '', detail: '' }
      await conn.query(
        `INSERT INTO service_results (booking_id, result_detail, status, completed_date, completed_time, note)
         VALUES (:id, :detail, :status, CURDATE(), CURTIME(), :note)
         ON DUPLICATE KEY UPDATE
           result_detail = VALUES(result_detail), status = VALUES(status),
           completed_date = VALUES(completed_date), completed_time = VALUES(completed_time),
           note = VALUES(note)`,
        { id, detail: r.detail || '', status: r.status || 'done', note: r.note || '' },
      )
    }
    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
  return getBookingById(id)
}

async function cancelBookingByCustomer(id, cancelReason) {
  await pool.query(
    `UPDATE bookings SET status = 'cancelled', cancel_reason = ?, cancelled_by = 'customer', cancelled_at = NOW()
     WHERE booking_id = ?`,
    [String(cancelReason || 'ลูกค้ายกเลิกเอง').trim(), id],
  )
  return getBookingById(id)
}

// ---------------------------------------------------------------------
// customers (derived from users + bookings, same shape as before)
// ---------------------------------------------------------------------
async function getCustomers() {
  const [users] = await pool.query(`SELECT * FROM users WHERE role = 'customer'`)
  const bookings = await getBookings()
  return users
    .map((u) => {
      const own = bookings.filter((b) => b.userId === str(u.user_id))
      const done = own.filter((b) => b.status === 'completed')
      return {
        id: str(u.user_id),
        fullName: u.full_name || '',
        phone: u.phone || '',
        lineUserId: u.line_user_id || null,
        visits: done.length,
        totalSpend: done.reduce((s, b) => s + (b.totalPrice || 0), 0),
        lastVisit: own.map((b) => b.bookingDate).sort().at(-1) || null,
        upcoming: own.filter((b) => ['pending', 'confirmed'].includes(b.status)).length,
      }
    })
    .sort((a, b) => b.totalSpend - a.totalSpend)
}

// ---------------------------------------------------------------------
// settings (single JSON row)
// ---------------------------------------------------------------------
async function getSettings() {
  const [[row]] = await pool.query('SELECT data FROM shop_settings WHERE id = 1')
  return row ? { id: 'shop', ...row.data } : {}
}

async function saveSettings(patch) {
  const current = await getSettings()
  const merged = { ...current, ...patch }
  delete merged.id
  // Plain string, not CAST(... AS JSON): MariaDB's JSON type is a LONGTEXT
  // alias validated by a CHECK constraint and does not accept "AS JSON" as
  // a CAST target, while MySQL accepts a JSON-text string here just as
  // readily — this form works unchanged on both engines.
  await pool.query(
    `INSERT INTO shop_settings (id, data) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data)`,
    [JSON.stringify(merged)],
  )
  return { id: 'shop', ...merged }
}

module.exports = {
  getServices, createService, updateService, deleteService,
  getStaff, createStaff, updateStaff, deleteStaff,
  getClosures, createClosure, deleteClosure,
  getBookings, getBookingById, createBookingTx, updateBookingStatus, cancelBookingByCustomer,
  findUserNumericId, getUserExternalId, getCustomers,
  getSettings, saveSettings,
}
