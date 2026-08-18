import { useMemo, useRef, useState } from 'react'
import { Users, Heart, CalendarClock, Wallet, Search, Phone } from 'lucide-react'
import Corners from '../components/ui/Corners'
import StatCard from '../components/dashboard/StatCard'
import Modal from '../components/ui/Modal'
import { useData } from '../context/DataContext'
import { baht, dateTH } from '../lib/status'

export default function Customers() {
  const { customers } = useData()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all') // all | regular | upcoming
  const [selected, setSelected] = useState(null)
  const listRef = useRef(null)
  const pick = (f) => { setFilter(f); requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }

  const rows = useMemo(
    () => customers
      .filter((c) => (filter === 'all' ? true : filter === 'regular' ? c.visits >= 5 : (c.upcoming || 0) > 0))
      .filter((c) => (q.trim() === '' ? true : ((c.fullName || '') + (c.phone || '')).includes(q.trim()))),
    [customers, q, filter],
  )

  const regulars = customers.filter((c) => c.visits >= 5).length
  const upcoming = customers.reduce((s, c) => s + (c.upcoming || 0), 0)
  const avgSpend = customers.length ? Math.round(customers.reduce((s, c) => s + (c.totalSpend || 0), 0) / customers.length) : 0

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard icon={Users} label="ลูกค้าทั้งหมด" value={customers.length} sub="ในระบบ" onClick={() => pick('all')} active={filter === 'all'} />
        <StatCard icon={Heart} label="ลูกค้าประจำ" value={regulars} sub="ใช้บริการ ≥ 5 ครั้ง" onClick={() => pick('regular')} active={filter === 'regular'} />
        <StatCard icon={CalendarClock} label="นัดที่จะถึง" value={upcoming} sub="รวมทุกคน" onClick={() => pick('upcoming')} active={filter === 'upcoming'} />
        <StatCard icon={Wallet} label="ยอดใช้จ่ายเฉลี่ย" value={baht(avgSpend)} sub="ต่อคน" onClick={() => pick('all')} active={false} />
      </div>

      <div ref={listRef} className="card blueprint" style={{ padding: 0, overflow: 'hidden', scrollMarginTop: 16 }}>
        <Corners />
        <div className="flex flex-wrap items-center gap-3 px-[22px] pb-[14px] pt-[18px]">
          <div className="mr-auto">
            <h3 className="serif-display m-0 text-[19px]">ฐานข้อมูลลูกค้า</h3>
            <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>{rows.length} คน · คลิกเพื่อดูรายละเอียด</p>
          </div>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2" style={{ color: 'var(--color-neutral-500)' }} />
            <input className="search-input" placeholder="ค้นหาชื่อ / เบอร์โทร" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto scroll-thin">
          <table className="table" style={{ minWidth: 720 }}>
            <thead>
              <tr><th>ลูกค้า</th><th>เบอร์โทร</th><th>มาแล้ว</th><th>ยอดสะสม</th><th>ครั้งล่าสุด</th><th>นัดถัดไป</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="apt-row" style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
                  <td className="whitespace-nowrap font-semibold">{c.fullName || '—'}</td>
                  <td className="whitespace-nowrap" style={{ color: 'var(--color-neutral-600)' }}>{c.phone || '—'}</td>
                  <td>{c.visits} ครั้ง</td>
                  <td className="whitespace-nowrap font-semibold">{baht(c.totalSpend || 0)}</td>
                  <td className="whitespace-nowrap" style={{ color: 'var(--color-neutral-600)' }}>{c.lastVisit ? dateTH(c.lastVisit) : '—'}</td>
                  <td>{c.upcoming ? <span className="tag tag-accent">{c.upcoming} นัด</span> : <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center" style={{ color: 'var(--color-neutral-500)' }}>ยังไม่มีลูกค้าในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <Modal title={selected.fullName || 'ลูกค้า'} subtitle="ข้อมูลลูกค้า" onClose={() => setSelected(null)}
          footer={<button className="btn btn-secondary" onClick={() => setSelected(null)}>ปิด</button>}>
          <div className="flex items-center gap-4">
            <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full font-display text-[20px] font-semibold" style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-800)' }}>
              {(selected.fullName || '?').slice(0, 1)}
            </div>
            <div>
              <p className="serif-display m-0 text-[18px]">{selected.fullName || '—'}</p>
              <p className="m-0 mt-[2px] flex items-center gap-[6px] text-[13px]" style={{ color: 'var(--color-neutral-600)' }}><Phone size={13} /> {selected.phone || '—'}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-[12px]" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="rounded-[12px] p-3 text-center" style={{ background: 'var(--color-neutral-100)' }}>
              <p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>มาแล้ว</p>
              <p className="m-0 mt-1 font-display text-[22px] font-semibold">{selected.visits || 0}</p>
            </div>
            <div className="rounded-[12px] p-3 text-center" style={{ background: 'var(--color-neutral-100)' }}>
              <p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>ยอดสะสม</p>
              <p className="m-0 mt-1 font-display text-[20px] font-semibold">{baht(selected.totalSpend || 0)}</p>
            </div>
            <div className="rounded-[12px] p-3 text-center" style={{ background: 'var(--color-neutral-100)' }}>
              <p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>นัดถัดไป</p>
              <p className="m-0 mt-1 font-display text-[22px] font-semibold">{selected.upcoming || 0}</p>
            </div>
          </div>
          <p className="m-0 mt-4 text-[13px]" style={{ color: 'var(--color-neutral-600)' }}>
            มาใช้บริการล่าสุด: {selected.lastVisit ? dateTH(selected.lastVisit) : '—'}
          </p>
        </Modal>
      )}
    </div>
  )
}
