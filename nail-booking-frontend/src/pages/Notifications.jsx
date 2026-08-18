import { useMemo, useState } from 'react'
import { CalendarPlus, CircleCheck, CheckCheck, XCircle, CalendarClock } from 'lucide-react'
import Corners from '../components/ui/Corners'
import { useData } from '../context/DataContext'
import { baht, dateTH } from '../lib/status'

const META = {
  pending:   { key: 'pending',   label: 'จองใหม่',    verb: 'จองคิวใหม่',   icon: CalendarPlus, tint: 'var(--color-accent-100)',   color: 'var(--color-accent-700)' },
  confirmed: { key: 'confirmed', label: 'ยืนยันแล้ว', verb: 'ได้รับการยืนยัน', icon: CircleCheck,  tint: 'var(--color-accent-100)',   color: 'var(--color-accent-700)' },
  completed: { key: 'completed', label: 'เสร็จสิ้น',  verb: 'ใช้บริการเสร็จสิ้น', icon: CheckCheck, tint: 'var(--color-accent-2-100)', color: 'var(--color-accent-800)' },
  cancelled: { key: 'cancelled', label: 'ยกเลิก',     verb: 'ยกเลิกการจอง',  icon: XCircle,      tint: 'var(--color-neutral-100)',  color: 'var(--color-neutral-700)' },
  no_show:   { key: 'cancelled', label: 'ยกเลิก',     verb: 'ไม่มาตามนัด',   icon: XCircle,      tint: 'var(--color-neutral-100)',  color: 'var(--color-neutral-700)' },
}
const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'จองใหม่' },
  { key: 'confirmed', label: 'ยืนยันแล้ว' },
  { key: 'completed', label: 'เสร็จสิ้น' },
  { key: 'cancelled', label: 'ยกเลิก' },
]

const tsOf = (b) => (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : new Date(b.bookingDate + 'T00:00:00').getTime())
const ago = (ms) => {
  const m = Math.floor((Date.now() - ms) / 60000)
  if (m < 1) return 'เมื่อสักครู่'
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชม.ที่แล้ว`
  return `${Math.floor(h / 24)} วันที่แล้ว`
}

export default function Notifications() {
  const { bookings } = useData()
  const [filter, setFilter] = useState('all')

  const feed = useMemo(
    () => [...bookings].sort((a, b) => tsOf(b) - tsOf(a)).map((b) => ({ ...b, meta: META[b.status] || META.pending })),
    [bookings],
  )
  const rows = feed.filter((b) => (filter === 'all' ? true : (b.meta.key === filter)))
  const count = (k) => (k === 'all' ? feed.length : feed.filter((b) => b.meta.key === k).length)

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="card blueprint" style={{ padding: 0, overflow: 'hidden' }}>
        <Corners />
        <div className="flex flex-wrap items-center gap-3 px-[22px] pb-[14px] pt-[18px]">
          <div className="mr-auto">
            <h3 className="serif-display m-0 text-[19px]">การแจ้งเตือน</h3>
            <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>ความเคลื่อนไหวของการจอง (เรียลไทม์)</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-[22px] pb-[14px]">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`tag ${filter === f.key ? 'tag-accent' : 'tag-neutral'}`} style={{ cursor: 'pointer', padding: '5px 12px', borderRadius: 999 }}>
              {f.label} · {count(f.key)}
            </button>
          ))}
        </div>

        <div className="flex flex-col">
          {rows.map((b, i) => {
            const Icon = b.meta.icon
            return (
              <div key={b.id} className="flex items-start gap-[14px] px-[22px] py-[15px]"
                style={{ borderTop: i === 0 ? 'none' : '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
                <span className="flex h-[40px] w-[40px] flex-none items-center justify-center rounded-[12px]" style={{ background: b.meta.tint, color: b.meta.color }}>
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[14px] font-medium">
                    <span style={{ color: 'var(--color-accent-800)' }}>{b.userName}</span> {b.meta.verb}
                  </p>
                  <p className="m-0 mt-[2px] text-[12.5px]" style={{ color: 'var(--color-neutral-600)' }}>
                    {(b.items || []).map((it) => it.name).join(' · ')} · {dateTH(b.bookingDate)} {b.startTime} · {baht(b.totalPrice || 0)}
                  </p>
                </div>
                <div className="flex flex-none flex-col items-end gap-[6px]">
                  <span className={`tag ${b.meta.key === 'cancelled' ? 'tag-neutral' : 'tag-accent'}`}>{b.meta.label}</span>
                  <span className="whitespace-nowrap text-[11px]" style={{ color: 'var(--color-neutral-500)' }}>{ago(tsOf(b))}</span>
                </div>
              </div>
            )
          })}
          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <CalendarClock size={26} style={{ color: 'var(--color-neutral-400)' }} />
              <p className="m-0 text-[13px]" style={{ color: 'var(--color-neutral-500)' }}>ยังไม่มีความเคลื่อนไหว</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
