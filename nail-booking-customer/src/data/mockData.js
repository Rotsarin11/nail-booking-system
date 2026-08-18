// Mock data mirroring the Firestore schema (firestore_data_model.md).
// Same shapes as the admin app — swap for live Firestore/LIFF later.

const pad = (n) => String(n).padStart(2, '0')
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const dayOffset = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toKey(d)
}
export const TODAY = toKey(new Date())

// ── shop info ───────────────────────────────────────────────────────
export const shop = {
  name: 'Take Care Nail',
  tagline: 'ร้านทำเล็บครบวงจร ดูแลทุกปลายนิ้ว',
  phone: '098-145-0399',
  address: 'ถ.นิมมานเหมินท์ ซ.9 อ.เมือง จ.เชียงใหม่',
  openText: 'เปิดทุกวัน 10:00 – 19:00 น.',
  openHour: 10, // shop opens
  closeHour: 19, // last service must finish by
  lineId: '@takecarenail',
}

// ── services collection ─────────────────────────────────────────────
export const services = [
  { id: 'svc_gel', name: 'ทาสีเจล', category: 'ทาสี', description: 'ทาสีเจลติดทน เงางาม เลือกได้หลายเฉดสี', durationMin: 60, bufferMin: 10, price: 350, isActive: true, icon: 'paintbrush' },
  { id: 'svc_extgel', name: 'ต่อเล็บเจล', category: 'ต่อเล็บ', description: 'ต่อเล็บเจลพร้อมตะไบทรงตามต้องการ', durationMin: 120, bufferMin: 15, price: 700, isActive: true, icon: 'sparkles' },
  { id: 'svc_paint', name: 'เพ้นท์ลวดลาย', category: 'เพ้นท์', description: 'เพ้นท์ลายมือ ออกแบบเฉพาะคุณ', durationMin: 45, bufferMin: 10, price: 200, isActive: true, icon: 'palette' },
  { id: 'svc_remove', name: 'ถอดเล็บ', category: 'ดูแล', description: 'ถอดเล็บเจล/อะคริลิคอย่างถูกวิธี ไม่ทำร้ายเล็บ', durationMin: 30, bufferMin: 5, price: 150, isActive: true, icon: 'droplet' },
  { id: 'svc_mani', name: 'ทำเล็บมือ (Manicure)', category: 'ดูแล', description: 'ดูแลเล็บมือ ขัดหนัง บำรุงผิวรอบเล็บ', durationMin: 50, bufferMin: 10, price: 300, isActive: true, icon: 'hand' },
  { id: 'svc_pedi', name: 'ทำเล็บเท้า (Pedicure)', category: 'ดูแล', description: 'ดูแลเล็บเท้า ขัดส้น สปาเท้าผ่อนคลาย', durationMin: 70, bufferMin: 10, price: 400, isActive: true, icon: 'footprints' },
]

export const serviceCategories = ['ทั้งหมด', ...Array.from(new Set(services.map((s) => s.category)))]

// ── staff collection ────────────────────────────────────────────────
// schedule: weekday (0=Sun..6=Sat) -> { start, end }; missing day = off
const fullWeek = {
  1: { start: '10:00', end: '19:00' }, 2: { start: '10:00', end: '19:00' },
  3: { start: '10:00', end: '19:00' }, 4: { start: '10:00', end: '19:00' },
  5: { start: '10:00', end: '19:00' }, 6: { start: '10:00', end: '19:00' },
  0: { start: '11:00', end: '18:00' },
}
export const staff = [
  { id: 'staff_001', fullName: 'ช่างเอ', nickname: 'เอ', phone: '0820000001', specialty: 'ต่อเล็บ, เพ้นท์เล็บ', rating: 4.9, status: 'active', serviceIds: ['svc_gel', 'svc_extgel', 'svc_paint'], schedule: fullWeek },
  { id: 'staff_002', fullName: 'ช่างบี', nickname: 'บี', phone: '0820000002', specialty: 'ทาสีเจล, ดูแลเล็บ', rating: 4.8, status: 'active', serviceIds: ['svc_gel', 'svc_mani', 'svc_pedi', 'svc_remove'], schedule: fullWeek },
  { id: 'staff_003', fullName: 'ช่างซี', nickname: 'ซี', phone: '0820000003', specialty: 'เพ้นท์ลวดลาย', rating: 4.7, status: 'active', serviceIds: ['svc_paint', 'svc_gel', 'svc_mani'], schedule: fullWeek },
]

// ── current logged-in customer (mock LIFF profile) ──────────────────
export const currentUser = {
  id: 'u_101',
  role: 'customer',
  fullName: 'พิมพ์ชนก ใจดี',
  displayName: 'Pim',
  phone: '081-111-1101',
  lineUserId: 'Uxxxxxxxxdemo',
  pictureUrl: '',
  memberSince: dayOffset(-120),
}

// ── bookings collection ─────────────────────────────────────────────
const mk = (id, userId, userName, staffId, staffName, date, startTime, endTime, status, itemIds, note = '') => {
  const items = itemIds.map((sid) => {
    const s = services.find((x) => x.id === sid)
    return { serviceId: sid, name: s.name, priceSnapshot: s.price, durationSnapshot: s.durationMin }
  })
  return {
    id, userId, userName, staffId, staffName,
    bookingDate: date, startTime, endTime, status, note,
    totalPrice: items.reduce((s, it) => s + it.priceSnapshot, 0),
    items,
    createdAt: date,
  }
}

// Shop-wide bookings — used to compute slot availability for every staff.
export const bookings = [
  // other customers today / upcoming (block slots)
  mk('bk_001', 'u_201', 'ณัฐริกา', 'staff_001', 'ช่างเอ', TODAY, '10:00', '12:15', 'confirmed', ['svc_extgel']),
  mk('bk_002', 'u_202', 'สุชานาถ', 'staff_002', 'ช่างบี', TODAY, '10:30', '11:40', 'confirmed', ['svc_gel']),
  mk('bk_003', 'u_203', 'กัญญาณัฐ', 'staff_003', 'ช่างซี', TODAY, '13:00', '13:55', 'pending', ['svc_paint']),
  mk('bk_010', 'u_204', 'ธนพร', 'staff_001', 'ช่างเอ', dayOffset(1), '13:00', '15:15', 'confirmed', ['svc_extgel']),
  mk('bk_011', 'u_205', 'อรอนงค์', 'staff_002', 'ช่างบี', dayOffset(2), '11:00', '12:20', 'pending', ['svc_pedi']),
  mk('bk_012', 'u_206', 'ชลิตา', 'staff_003', 'ช่างซี', dayOffset(1), '10:00', '11:00', 'confirmed', ['svc_gel']),

  // ★ the current customer's own bookings (shown in "นัดของฉัน")
  mk('bk_100', 'u_101', 'พิมพ์ชนก ใจดี', 'staff_001', 'ช่างเอ', dayOffset(2), '15:00', '16:10', 'confirmed', ['svc_gel', 'svc_paint'], 'ขอโทนสีชมพูอ่อนค่ะ'),
  mk('bk_101', 'u_101', 'พิมพ์ชนก ใจดี', 'staff_002', 'ช่างบี', dayOffset(5), '11:00', '12:20', 'pending', ['svc_pedi'], ''),
  // history
  mk('bk_h1', 'u_101', 'พิมพ์ชนก ใจดี', 'staff_001', 'ช่างเอ', dayOffset(-14), '10:00', '12:15', 'completed', ['svc_extgel'], ''),
  mk('bk_h2', 'u_101', 'พิมพ์ชนก ใจดี', 'staff_003', 'ช่างซี', dayOffset(-30), '13:00', '13:55', 'completed', ['svc_paint'], ''),
  mk('bk_h3', 'u_101', 'พิมพ์ชนก ใจดี', 'staff_002', 'ช่างบี', dayOffset(-45), '14:00', '15:00', 'completed', ['svc_gel'], ''),
  mk('bk_h4', 'u_101', 'พิมพ์ชนก ใจดี', 'staff_001', 'ช่างเอ', dayOffset(-60), '11:00', '11:55', 'cancelled', ['svc_mani'], ''),
]

// ── closures collection (shop holidays + staff leave) ──────────────
// Firestore shape: closureDate + staffId (null = whole shop)
export const closures = [
  { id: 'cl_1', closureDate: dayOffset(3), staffId: 'staff_002', reason: 'ลาป่วย' },
  { id: 'cl_2', closureDate: dayOffset(7), staffId: null, reason: 'ปิดปรับปรุงร้าน' },
]

// per-customer stats (for profile page)
export function customerStats(userId) {
  const own = bookings.filter((b) => b.userId === userId)
  const done = own.filter((b) => b.status === 'completed')
  return {
    visits: done.length,
    totalSpend: done.reduce((s, b) => s + b.totalPrice, 0),
    lastVisit: done.map((b) => b.bookingDate).sort().at(-1) || null,
    upcoming: own.filter((b) => ['confirmed', 'pending'].includes(b.status) && b.bookingDate >= TODAY).length,
  }
}
