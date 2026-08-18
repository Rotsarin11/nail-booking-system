import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CalendarDays, Clock3, CheckCircle2, Wallet, Search, Check, X, CheckCheck, UserX, ChevronRight } from 'lucide-react'
import Corners from '../components/ui/Corners'
import StatCard from '../components/dashboard/StatCard'
import Modal, { Field, fieldStyle } from '../components/ui/Modal'
import { useData } from '../context/DataContext'
import { TODAY } from '../data/mockData'
import { STATUS_META, baht, dateTH } from '../lib/status'

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'today', label: 'วันนี้' },
  { key: 'pending', label: 'รอยืนยัน' },
  { key: 'confirmed', label: 'ยืนยันแล้ว' },
  { key: 'completed', label: 'เสร็จสิ้น' },
  { key: 'cancelled', label: 'ยกเลิก' },
]

export default function Bookings() {
  const { bookings, updateStatus } = useData()
  const loc = useLocation()
  const [filter, setFilter] = useState(loc.state?.filter || 'all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const listRef = useRef(null)

  // Apply a filter passed from the dashboard cards (router state).
  useEffect(() => {
    if (loc.state?.filter) setFilter(loc.state.filter)
  }, [loc.state])

  // When arriving from a bell notification, open that booking's confirm modal.
  const openedRef = useRef(null)
  useEffect(() => {
    const id = loc.state?.openId
    if (!id || openedRef.current === id) return
    const b = bookings.find((x) => x.id === id)
    if (b) { setSelected(b); openedRef.current = id }
  }, [loc.state, bookings])

  // Pick a filter from a stat card, then scroll the (now-filtered) list into view.
  const pick = (f) => {
    setFilter(f)
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const match = (b) => (filter === 'all' ? true : filter === 'today' ? b.bookingDate === TODAY : b.status === filter)
  const rows = useMemo(() => {
    return bookings
      .filter(match)
      .filter((b) => (q.trim() === '' ? true : (b.userName + b.staffName + (b.items || []).map((i) => i.name).join()).includes(q.trim())))
      .sort((a, b) => (b.bookingDate + b.startTime).localeCompare(a.bookingDate + a.startTime))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, q, bookings])

  const todays = bookings.filter((b) => b.bookingDate === TODAY)
  const pending = bookings.filter((b) => b.status === 'pending').length
  const completed = bookings.filter((b) => b.status === 'completed').length
  const revenueToday = todays.filter((b) => b.status === 'completed').reduce((s, b) => s + (b.totalPrice || 0), 0)
  const count = (key) => (key === 'all' ? bookings.length : key === 'today' ? todays.length : bookings.filter((b) => b.status === key).length)

  // status-change helpers used by the row + the detail modal
  const act = (id, status, opts) => { updateStatus(id, status, opts); setSelected((s) => (s && s.id === id ? { ...s, status } : s)) }
  const sel = selected

  // cancellation requires a reason (international best practice)
  const [cancelling, setCancelling] = useState(null) // booking being cancelled
  const [reason, setReason] = useState('ช่างไม่พร้อมให้บริการ')
  const [reasonNote, setReasonNote] = useState('')
  const askCancel = (b) => { setReason('ช่างไม่พร้อมให้บริการ'); setReasonNote(''); setCancelling(b) }
  const REASONS = ['ช่างไม่พร้อมให้บริการ', 'ร้านปิดกะทันหัน / เหตุสุดวิสัย', 'ลูกค้าขอยกเลิก / เลื่อนนัด', 'ข้อมูลการจองไม่ถูกต้อง', 'อื่นๆ']
  const confirmCancel = () => {
    const text = reason === 'อื่นๆ' ? reasonNote.trim() : (reasonNote.trim() ? `${reason} — ${reasonNote.trim()}` : reason)
    if (!text) return
    act(cancelling.id, 'cancelled', { cancelReason: text })
    setCancelling(null)
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard icon={CalendarDays} label="คิววันนี้" value={todays.length} sub="ทั้งหมดในวันนี้" onClick={() => pick('today')} active={filter === 'today'} />
        <StatCard icon={Clock3} label="รอยืนยัน" value={pending} sub="ต้องดำเนินการ" onClick={() => pick('pending')} active={filter === 'pending'} />
        <StatCard icon={CheckCircle2} label="เสร็จสิ้นแล้ว" value={completed} sub="สะสมทั้งหมด" onClick={() => pick('completed')} active={filter === 'completed'} />
        <StatCard icon={Wallet} label="รายได้วันนี้" value={baht(revenueToday)} sub="จากงานที่เสร็จสิ้น" onClick={() => pick('completed')} active={false} />
      </div>

      <div ref={listRef} className="card blueprint" style={{ padding: 0, overflow: 'hidden', scrollMarginTop: 16 }}>
        <Corners />
        <div className="flex flex-wrap items-center gap-3 px-[22px] pb-[14px] pt-[18px]">
          <div className="mr-auto">
            <h3 className="serif-display m-0 text-[19px]">รายการจอง</h3>
            <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>{rows.length} รายการ · คลิกแถวเพื่อดู/จัดการ</p>
          </div>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2" style={{ color: 'var(--color-neutral-500)' }} />
            <input className="search-input" placeholder="ค้นหาลูกค้า / ช่าง / บริการ" value={q} onChange={(e) => setQ(e.target.value)} />
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

        <div className="overflow-x-auto scroll-thin">
          <table className="table" style={{ minWidth: 860 }}>
            <thead>
              <tr><th>ลูกค้า</th><th>บริการ</th><th>ช่าง</th><th>วัน–เวลา</th><th>ยอด</th><th>สถานะ</th><th>จัดการ</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const meta = STATUS_META[b.status]
                return (
                  <tr key={b.id} className="apt-row" style={{ cursor: 'pointer' }} onClick={() => setSelected(b)}>
                    <td className="whitespace-nowrap font-semibold">{b.userName}</td>
                    <td style={{ color: 'var(--color-neutral-600)' }}>{(b.items || []).map((i) => i.name).join(', ')}</td>
                    <td className="whitespace-nowrap" style={{ color: 'var(--color-neutral-600)' }}>{b.staffName}</td>
                    <td className="whitespace-nowrap">{dateTH(b.bookingDate)} <span style={{ color: 'var(--color-neutral-400)' }}>· {b.startTime}</span></td>
                    <td className="whitespace-nowrap font-semibold">{baht(b.totalPrice)}</td>
                    <td><span className={`tag ${meta.tag}`}>{meta.label}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {b.status === 'pending' && (
                          <>
                            <button type="button" onClick={() => act(b.id, 'confirmed')} className="btn btn-primary" style={{ padding: '5px 10px' }}><Check size={14} /> ยืนยัน</button>
                            <button type="button" onClick={() => askCancel(b)} className="btn btn-secondary" style={{ padding: '5px 10px' }}><X size={14} /> ยกเลิก</button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button type="button" onClick={() => act(b.id, 'completed')} className="btn btn-primary" style={{ padding: '5px 10px' }}><CheckCheck size={14} /> เสร็จสิ้น</button>
                        )}
                        {!['pending', 'confirmed'].includes(b.status) && <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                      </div>
                    </td>
                    <td><ChevronRight size={16} style={{ color: 'var(--color-neutral-400)' }} /></td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center" style={{ color: 'var(--color-neutral-500)' }}>ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sel && (
        <Modal
          title="รายละเอียดการจอง"
          subtitle={`${sel.userName} · ${dateTH(sel.bookingDate)} ${sel.startTime}`}
          onClose={() => setSelected(null)}
          footer={<>
            {sel.status === 'pending' && <>
              <button className="btn btn-secondary" onClick={() => askCancel(sel)}><X size={15} /> ยกเลิก</button>
              <button className="btn btn-primary" onClick={() => act(sel.id, 'confirmed')}><Check size={15} /> ยืนยันการจอง</button>
            </>}
            {sel.status === 'confirmed' && <>
              <button className="btn btn-secondary" onClick={() => act(sel.id, 'no_show')}><UserX size={15} /> ไม่มาตามนัด</button>
              <button className="btn btn-secondary" onClick={() => askCancel(sel)}><X size={15} /> ยกเลิก</button>
              <button className="btn btn-primary" onClick={() => act(sel.id, 'completed')}><CheckCheck size={15} /> เสร็จสิ้น</button>
            </>}
            {!['pending', 'confirmed'].includes(sel.status) && <button className="btn btn-secondary" onClick={() => setSelected(null)}>ปิด</button>}
          </>}
        >
          <div className="flex items-center justify-between">
            <span className="serif-display text-[26px]" style={{ color: 'var(--color-accent-900)' }}>{sel.startTime}<span className="text-[16px]" style={{ color: 'var(--color-neutral-500)' }}> – {sel.endTime}</span></span>
            <span className={`tag ${STATUS_META[sel.status].tag}`}>{STATUS_META[sel.status].label}</span>
          </div>
          <div className="mt-4 grid gap-3 text-[14px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div><p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>ลูกค้า</p><p className="m-0 font-medium">{sel.userName}</p></div>
            <div><p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>ช่าง</p><p className="m-0 font-medium">{sel.staffName}</p></div>
            <div><p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>วันที่</p><p className="m-0 font-medium">{dateTH(sel.bookingDate)}</p></div>
            <div><p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>รหัสคิว</p><p className="m-0 font-medium" style={{ fontFamily: 'Manrope' }}>{sel.id}</p></div>
          </div>
          {sel.note && (
            <div className="mt-3 rounded-[10px] p-3 text-[13px]" style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-700)' }}>
              <span style={{ color: 'var(--color-neutral-500)' }}>หมายเหตุ: </span>{sel.note}
            </div>
          )}
          {sel.status === 'cancelled' && sel.cancelReason && (
            <div className="mt-3 rounded-[10px] p-3 text-[13px]" style={{ background: '#fdecec', color: '#a3402f' }}>
              <span style={{ opacity: 0.75 }}>เหตุผลที่ยกเลิก: </span>{sel.cancelReason}
              {sel.cancelledBy && <span style={{ opacity: 0.75 }}> · โดย{sel.cancelledBy === 'admin' ? 'ร้าน' : 'ลูกค้า'}</span>}
            </div>
          )}
          <div className="mt-4">
            <p className="m-0 mb-2 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>รายการบริการ</p>
            <div className="flex flex-col gap-2">
              {(sel.items || []).map((it, i) => (
                <div key={i} className="flex items-center justify-between text-[14px]">
                  <span>{it.name}</span>
                  <span className="font-medium" style={{ fontFamily: 'Manrope' }}>{baht(it.priceSnapshot)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--color-divider)' }}>
              <span className="text-[13px]" style={{ color: 'var(--color-neutral-600)' }}>ยอดรวม</span>
              <span className="serif-display text-[20px]" style={{ color: 'var(--color-accent-900)' }}>{baht(sel.totalPrice)}</span>
            </div>
          </div>
        </Modal>
      )}

      {cancelling && (
        <Modal
          title="ยกเลิกการจอง"
          subtitle={`${cancelling.userName} · ${dateTH(cancelling.bookingDate)} ${cancelling.startTime}`}
          width={460}
          onClose={() => setCancelling(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setCancelling(null)}>ปิด</button>
            <button className="btn btn-primary" disabled={reason === 'อื่นๆ' && !reasonNote.trim()} onClick={confirmCancel}><X size={15} /> ยืนยันการยกเลิก</button>
          </>}
        >
          <p className="m-0 mb-3 text-[13px]" style={{ color: 'var(--color-neutral-600)' }}>โปรดระบุเหตุผล ระบบจะบันทึกและแจ้งให้ลูกค้าทราบ</p>
          <Field label="เหตุผล">
            <select style={fieldStyle} value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <div className="mt-3">
            <Field label={reason === 'อื่นๆ' ? 'ระบุเหตุผล (จำเป็น)' : 'รายละเอียดเพิ่มเติม (ถ้ามี)'}>
              <textarea rows={3} style={{ ...fieldStyle, resize: 'none' }} value={reasonNote} onChange={(e) => setReasonNote(e.target.value)}
                placeholder={reason === 'อื่นๆ' ? 'พิมพ์เหตุผล…' : 'เช่น ช่างลาป่วยกะทันหัน'} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  )
}
