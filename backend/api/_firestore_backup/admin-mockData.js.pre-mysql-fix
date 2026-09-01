// Mock data mirroring the Firestore schema (firestore_data_model.md).
// Swap these arrays for live Firestore queries later — shapes match the collections.

// Helpers to build dates relative to "today" so the dashboard always looks alive.
const pad = (n) => String(n).padStart(2, '0')
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const dayOffset = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export const TODAY = toKey(new Date())

// ── services collection ─────────────────────────────────────────────
export const services = [
  { id: 'svc_gel', name: 'ทาสีเจล', category: 'ทาสี', durationMin: 60, bufferMin: 10, price: 350, isActive: true },
  { id: 'svc_extgel', name: 'ต่อเล็บเจล', category: 'ต่อเล็บ', durationMin: 120, bufferMin: 15, price: 700, isActive: true },
  { id: 'svc_paint', name: 'เพ้นท์ลวดลาย', category: 'เพ้นท์', durationMin: 45, bufferMin: 10, price: 200, isActive: true },
  { id: 'svc_remove', name: 'ถอดเล็บ', category: 'ดูแล', durationMin: 30, bufferMin: 5, price: 150, isActive: true },
  { id: 'svc_mani', name: 'ทำเล็บมือ (Manicure)', category: 'ดูแล', durationMin: 50, bufferMin: 10, price: 300, isActive: true },
  { id: 'svc_pedi', name: 'ทำเล็บเท้า (Pedicure)', category: 'ดูแล', durationMin: 70, bufferMin: 10, price: 400, isActive: true },
]

// ── staff collection ────────────────────────────────────────────────
export const staff = [
  { id: 'staff_001', fullName: 'ช่างเอ', nickname: 'เอ', phone: '0820000001', specialty: 'ต่อเล็บ, เพ้นท์เล็บ', status: 'active', serviceIds: ['svc_gel', 'svc_extgel', 'svc_paint'] },
  { id: 'staff_002', fullName: 'ช่างบี', nickname: 'บี', phone: '0820000002', specialty: 'ทาสีเจล, ดูแลเล็บ', status: 'active', serviceIds: ['svc_gel', 'svc_mani', 'svc_pedi', 'svc_remove'] },
  { id: 'staff_003', fullName: 'ช่างซี', nickname: 'ซี', phone: '0820000003', specialty: 'เพ้นท์ลวดลาย', status: 'active', serviceIds: ['svc_paint', 'svc_gel', 'svc_mani'] },
  { id: 'staff_004', fullName: 'ช่างดี', nickname: 'ดี', phone: '0820000004', specialty: 'ต่อเล็บ', status: 'inactive', serviceIds: ['svc_extgel', 'svc_remove'] },
]

// ── users collection (customers only shown here) ────────────────────
export const customers = [
  { id: 'u_101', role: 'customer', fullName: 'พิมพ์ชนก', phone: '0811111101', createdAt: dayOffset(-40) },
  { id: 'u_102', role: 'customer', fullName: 'ณัฐริกา', phone: '0811111102', createdAt: dayOffset(-30) },
  { id: 'u_103', role: 'customer', fullName: 'สุชานาถ', phone: '0811111103', createdAt: dayOffset(-21) },
  { id: 'u_104', role: 'customer', fullName: 'กัญญาณัฐ', phone: '0811111104', createdAt: dayOffset(-12) },
  { id: 'u_105', role: 'customer', fullName: 'ธนพร', phone: '0811111105', createdAt: dayOffset(-6) },
  { id: 'u_106', role: 'customer', fullName: 'อรอนงค์', phone: '0811111106', createdAt: dayOffset(-2) },
  { id: 'u_107', role: 'customer', fullName: 'ชลิตา', phone: '0811111107', createdAt: dayOffset(-1) },
  { id: 'u_108', role: 'customer', fullName: 'ปาลิตา', phone: '0811111108', createdAt: dayOffset(0) },
]

// ── bookings collection ─────────────────────────────────────────────
// status: pending | confirmed | completed | cancelled | no_show
const mk = (id, userName, staffId, staffName, date, startTime, endTime, status, itemIds, totalPrice) => ({
  id,
  userName,
  staffId,
  staffName,
  bookingDate: date,
  startTime,
  endTime,
  status,
  totalPrice,
  items: itemIds.map((sid) => {
    const s = services.find((x) => x.id === sid)
    return { serviceId: sid, name: s.name, priceSnapshot: s.price, durationSnapshot: s.durationMin }
  }),
})

export const bookings = [
  // today
  mk('bk_001', 'พิมพ์ชนก', 'staff_001', 'ช่างเอ', TODAY, '10:00', '12:15', 'confirmed', ['svc_extgel'], 700),
  mk('bk_002', 'ณัฐริกา', 'staff_002', 'ช่างบี', TODAY, '10:30', '11:30', 'completed', ['svc_gel'], 350),
  mk('bk_003', 'สุชานาถ', 'staff_003', 'ช่างซี', TODAY, '11:00', '11:55', 'confirmed', ['svc_paint'], 200),
  mk('bk_004', 'กัญญาณัฐ', 'staff_001', 'ช่างเอ', TODAY, '13:00', '14:10', 'pending', ['svc_gel', 'svc_paint'], 550),
  mk('bk_005', 'ธนพร', 'staff_002', 'ช่างบี', TODAY, '13:30', '14:50', 'confirmed', ['svc_pedi'], 400),
  mk('bk_006', 'อรอนงค์', 'staff_003', 'ช่างซี', TODAY, '15:00', '15:55', 'pending', ['svc_mani'], 300),
  mk('bk_007', 'ชลิตา', 'staff_001', 'ช่างเอ', TODAY, '16:00', '17:05', 'confirmed', ['svc_gel', 'svc_paint'], 550),
  mk('bk_008', 'ปาลิตา', 'staff_002', 'ช่างบี', TODAY, '09:00', '09:35', 'no_show', ['svc_remove'], 150),
  // upcoming
  mk('bk_009', 'พิมพ์ชนก', 'staff_003', 'ช่างซี', dayOffset(1), '10:00', '11:00', 'confirmed', ['svc_gel'], 350),
  mk('bk_010', 'ณัฐริกา', 'staff_001', 'ช่างเอ', dayOffset(1), '13:00', '15:15', 'confirmed', ['svc_extgel'], 700),
  mk('bk_011', 'ธนพร', 'staff_002', 'ช่างบี', dayOffset(2), '11:00', '12:20', 'pending', ['svc_pedi'], 400),
  // recent history (for revenue trend)
  mk('bk_h1', 'สุชานาถ', 'staff_001', 'ช่างเอ', dayOffset(-1), '10:00', '12:15', 'completed', ['svc_extgel'], 700),
  mk('bk_h2', 'กัญญาณัฐ', 'staff_002', 'ช่างบี', dayOffset(-1), '13:00', '14:00', 'completed', ['svc_gel'], 350),
  mk('bk_h3', 'ธนพร', 'staff_003', 'ช่างซี', dayOffset(-1), '15:00', '15:55', 'cancelled', ['svc_paint'], 200),
  mk('bk_h4', 'อรอนงค์', 'staff_001', 'ช่างเอ', dayOffset(-2), '11:00', '13:15', 'completed', ['svc_extgel'], 700),
  mk('bk_h5', 'ชลิตา', 'staff_002', 'ช่างบี', dayOffset(-2), '14:00', '15:20', 'completed', ['svc_pedi'], 400),
  mk('bk_h6', 'ปาลิตา', 'staff_003', 'ช่างซี', dayOffset(-3), '10:00', '10:55', 'completed', ['svc_mani'], 300),
  mk('bk_h7', 'พิมพ์ชนก', 'staff_001', 'ช่างเอ', dayOffset(-3), '13:00', '14:00', 'completed', ['svc_gel'], 350),
  mk('bk_h8', 'ณัฐริกา', 'staff_002', 'ช่างบี', dayOffset(-4), '11:00', '12:20', 'completed', ['svc_pedi'], 400),
  mk('bk_h9', 'สุชานาถ', 'staff_003', 'ช่างซี', dayOffset(-4), '15:00', '15:45', 'completed', ['svc_paint'], 200),
  mk('bk_h10', 'กัญญาณัฐ', 'staff_001', 'ช่างเอ', dayOffset(-5), '10:00', '12:15', 'completed', ['svc_extgel'], 700),
  mk('bk_h11', 'ธนพร', 'staff_002', 'ช่างบี', dayOffset(-5), '13:00', '14:00', 'completed', ['svc_gel'], 350),
  mk('bk_h12', 'อรอนงค์', 'staff_003', 'ช่างซี', dayOffset(-6), '11:00', '11:55', 'completed', ['svc_mani'], 300),
  mk('bk_h13', 'ชลิตา', 'staff_001', 'ช่างเอ', dayOffset(-6), '14:00', '15:00', 'completed', ['svc_gel'], 350),
]

// Weekday labels (Thai) for charts
export const weekdayLabelsTH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

// Revenue over the last 7 days (completed bookings only)
export function revenueLast7Days() {
  const out = []
  for (let i = 6; i >= 0; i--) {
    const key = dayOffset(-i)
    const d = new Date(key)
    const total = bookings
      .filter((b) => b.bookingDate === key && b.status === 'completed')
      .reduce((s, b) => s + b.totalPrice, 0)
    out.push({ day: weekdayLabelsTH[d.getDay()], date: key, revenue: total })
  }
  return out
}

// Count bookings today by status (for donut / breakdown)
export function bookingStatusToday() {
  const today = bookings.filter((b) => b.bookingDate === TODAY)
  const count = (s) => today.filter((b) => b.status === s).length
  return {
    total: today.length,
    pending: count('pending'),
    confirmed: count('confirmed'),
    completed: count('completed'),
    cancelled: count('cancelled'),
    no_show: count('no_show'),
  }
}

// ── closures collection (shop holidays + staff leave) ──────────────
// type: shop | leave  ·  status: approved | pending
export const closures = [
  { id: 'cl_1', date: dayOffset(-6),  type: 'shop',  staffId: null,        staffName: 'ทั้งร้าน', reason: 'หยุดประจำสัปดาห์ (อาทิตย์)', status: 'approved' },
  { id: 'cl_2', date: dayOffset(1),   type: 'leave', staffId: 'staff_004', staffName: 'ช่างดี',   reason: 'ลากิจธุระส่วนตัว',        status: 'pending'  },
  { id: 'cl_3', date: dayOffset(3),   type: 'leave', staffId: 'staff_002', staffName: 'ช่างบี',   reason: 'ลาป่วย',                 status: 'approved' },
  { id: 'cl_4', date: dayOffset(8),   type: 'shop',  staffId: null,        staffName: 'ทั้งร้าน', reason: 'หยุดประจำสัปดาห์ (อาทิตย์)', status: 'approved' },
  { id: 'cl_5', date: dayOffset(12),  type: 'leave', staffId: 'staff_001', staffName: 'ช่างเอ',   reason: 'อบรมเพ้นท์เล็บ',          status: 'pending'  },
]

export function closureStats() {
  return {
    total: closures.length,
    shop: closures.filter((c) => c.type === 'shop').length,
    leave: closures.filter((c) => c.type === 'leave').length,
    pending: closures.filter((c) => c.status === 'pending').length,
  }
}

// ── notifications feed ──────────────────────────────────────────────
// type (category): booking | cancel | leave | done | review | summary
export const notifications = [
  { id: 'nt_1',  type: 'booking', title: 'มีการจองใหม่รอยืนยัน', body: 'กัญญาณัฐ จอง "ทาสีเจล + เพ้นท์ลวดลาย" กับช่างเอ เวลา 13:00', time: '5 นาทีที่แล้ว', read: false },
  { id: 'nt_2',  type: 'cancel',  title: 'ลูกค้ายกเลิกการจอง', body: 'ธนพร ยกเลิก #bk_h3 (เพ้นท์ลวดลาย) กับช่างซี', time: '32 นาทีที่แล้ว', read: false },
  { id: 'nt_3',  type: 'leave',   title: 'คำขอลาของช่าง', body: 'ช่างดี ขอลากิจวันพรุ่งนี้ — รอการอนุมัติ', time: '1 ชั่วโมงที่แล้ว', read: false },
  { id: 'nt_7',  type: 'booking', title: 'มีการจองใหม่รอยืนยัน', body: 'อรอนงค์ จอง "ทำเล็บมือ" กับช่างซี เวลา 15:00', time: '2 ชั่วโมงที่แล้ว', read: false },
  { id: 'nt_8',  type: 'review',  title: 'รีวิวใหม่ 4 ดาว', body: 'กัญญาณัฐ ให้คะแนนช่างบี "ทำสวยดีค่ะ รอคิวนิดหน่อย"', time: '3 ชั่วโมงที่แล้ว', read: false },
  { id: 'nt_4',  type: 'done',    title: 'บริการเสร็จสิ้น', body: 'ณัฐริกา เสร็จสิ้นบริการ "ทาสีเจล" กับช่างบี', time: 'เมื่อวานนี้', read: true },
  { id: 'nt_9',  type: 'cancel',  title: 'ลูกค้ายกเลิกการจอง', body: 'ปาลิตา ยกเลิก #bk_008 (ถอดเล็บ) กับช่างบี', time: 'เมื่อวานนี้', read: true },
  { id: 'nt_5',  type: 'review',  title: 'รีวิวใหม่ 5 ดาว', body: 'พิมพ์ชนก ให้คะแนนช่างเอ "บริการดีมากค่ะ ประทับใจ"', time: 'เมื่อวานนี้', read: true },
  { id: 'nt_10', type: 'leave',   title: 'อนุมัติวันลาแล้ว', body: 'ช่างบี ลาป่วยวันที่ ' + dayOffset(3) + ' ได้รับการอนุมัติ', time: 'เมื่อวานนี้', read: true },
  { id: 'nt_6',  type: 'summary', title: 'สรุปยอดรายวัน', body: 'ยอดขายเมื่อวานรวม 1,750฿ จาก 5 คิว', time: '2 วันที่แล้ว', read: true },
  { id: 'nt_11', type: 'done',    title: 'บริการเสร็จสิ้น', body: 'สุชานาถ เสร็จสิ้นบริการ "เพ้นท์ลวดลาย" กับช่างเอ', time: '2 วันที่แล้ว', read: true },
]

// Notification category metadata (labels + order for the notifications page).
export const NOTIF_CATEGORIES = [
  { key: 'booking', label: 'การจอง' },
  { key: 'cancel',  label: 'การยกเลิก' },
  { key: 'leave',   label: 'วันลาช่าง' },
  { key: 'done',    label: 'บริการเสร็จสิ้น' },
  { key: 'review',  label: 'รีวิว' },
  { key: 'summary', label: 'สรุปยอด' },
]

// ── per-customer aggregates (visits, spend, last visit) ─────────────
export function customerStats() {
  return customers
    .map((c) => {
      const own = bookings.filter((b) => b.userName === c.fullName)
      const done = own.filter((b) => b.status === 'completed')
      const lastVisit = own.map((b) => b.bookingDate).sort().at(-1) || null
      return {
        ...c,
        visits: done.length,
        totalSpend: done.reduce((s, b) => s + b.totalPrice, 0),
        lastVisit,
      }
    })
    .sort((a, b) => b.totalSpend - a.totalSpend)
}

// Popular services (by number of items booked, last 7 days)
export function popularServices() {
  const counter = {}
  bookings.forEach((b) => {
    b.items.forEach((it) => {
      counter[it.name] = (counter[it.name] || 0) + 1
    })
  })
  return Object.entries(counter)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}
