// Booking-status labels + chip classes (rose-gold design), shared helpers.
export const STATUS_META = {
  pending:   { label: 'รอยืนยัน',    chip: 'chip-pending',   icon: 'clock' },
  confirmed: { label: 'ยืนยันแล้ว',  chip: 'chip-confirmed', icon: 'circle-check' },
  completed: { label: 'เสร็จสิ้น',   chip: 'chip-completed', icon: 'check' },
  cancelled: { label: 'ยกเลิกแล้ว',  chip: 'chip-cancelled', icon: 'x' },
  no_show:   { label: 'ไม่มาตามนัด', chip: 'chip-cancelled', icon: 'x' },
}

export const baht = (n) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n)

// Local (not UTC) YYYY-MM-DD for "today".
const _pad = (n) => String(n).padStart(2, '0')
export const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`
}
export const TODAY = todayKey()

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const TH_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const TH_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

// "26 ก.ค. 69" — accepts YYYY-MM-DD
export const dateTH = (key) => {
  if (!key) return '—'
  const [y, m, d] = key.split('-').map(Number)
  return `${d} ${TH_MONTHS[m - 1]} ${String((y + 543) % 100)}`
}
// "วันเสาร์ที่ 26 กรกฎาคม 2569"
export const dateTHLong = (key) => {
  if (!key) return '—'
  const [y, m, d] = key.split('-').map(Number)
  const wd = new Date(y, m - 1, d).getDay()
  return `วัน${TH_DAYS[wd]}ที่ ${d} ${TH_MONTHS_FULL[m - 1]} ${y + 543}`
}
export const weekdayTH = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return TH_DAYS_SHORT[new Date(y, m - 1, d).getDay()]
}
// "ส.ค." — short Thai month from a YYYY-MM-DD key
export const monthTH = (key) => {
  const m = Number(key.split('-')[1])
  return TH_MONTHS[m - 1]
}
// day-of-month number from a key
export const dayNum = (key) => Number(key.split('-')[2])
// "สิงหาคม 2569" — full month + Buddhist year
export const monthYearTH = (key) => {
  const [y, m] = key.split('-').map(Number)
  return `${TH_MONTHS_FULL[m - 1]} ${y + 543}`
}
