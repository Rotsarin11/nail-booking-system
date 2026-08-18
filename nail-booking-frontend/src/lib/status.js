// Booking-status labels, tag classes, and donut colors (rose-gold design).
export const STATUS_META = {
  pending:   { label: 'รอยืนยัน',    tag: 'tag-outline', color: 'var(--color-accent-400)' },
  confirmed: { label: 'ยืนยันแล้ว',  tag: 'tag-accent',  color: 'var(--color-accent-600)' },
  completed: { label: 'เสร็จสิ้น',   tag: 'tag-accent',  color: 'var(--color-accent-800)' },
  cancelled: { label: 'ยกเลิก',      tag: 'tag-neutral', color: 'var(--color-neutral-400)' },
  no_show:   { label: 'ไม่มาตามนัด', tag: 'tag-neutral', color: 'var(--color-neutral-300)' },
}

// Order used by the donut + legend.
export const STATUS_ORDER = ['confirmed', 'pending', 'completed', 'no_show', 'cancelled']

export const baht = (n) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n)

// Closure / leave metadata (holidays page).
export const CLOSURE_META = {
  shop:  { label: 'ปิดร้าน', tag: 'tag-neutral' },
  leave: { label: 'ช่างลา', tag: 'tag-outline' },
}
export const CLOSURE_STATUS_META = {
  approved: { label: 'อนุมัติแล้ว', tag: 'tag-accent' },
  pending:  { label: 'รออนุมัติ',  tag: 'tag-outline' },
}

// Short Thai date, e.g. "26 ก.ค. 69". Accepts a YYYY-MM-DD string.
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
export const dateTH = (key) => {
  if (!key) return '—'
  const [y, m, d] = key.split('-').map(Number)
  return `${d} ${TH_MONTHS[m - 1]} ${String((y + 543) % 100)}`
}
