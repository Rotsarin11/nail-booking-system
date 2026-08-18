import { useMemo, useRef, useState } from 'react'
import { Users, UserCheck, CalendarClock, Plus, Phone, Pencil, Trash2 } from 'lucide-react'
import Corners from '../components/ui/Corners'
import StatCard from '../components/dashboard/StatCard'
import Modal, { Field, fieldStyle } from '../components/ui/Modal'
import { useData } from '../context/DataContext'
import { TODAY } from '../data/mockData'

const DOW = [['1', 'จ'], ['2', 'อ'], ['3', 'พ'], ['4', 'พฤ'], ['5', 'ศ'], ['6', 'ส'], ['0', 'อา']]
const DEFAULT_HOURS = { start: '10:00', end: '19:00' }
const empty = { fullName: '', nickname: '', phone: '', specialty: '', status: 'active', serviceIds: [], schedule: { 1: DEFAULT_HOURS, 2: DEFAULT_HOURS, 3: DEFAULT_HOURS, 4: DEFAULT_HOURS, 5: DEFAULT_HOURS, 6: DEFAULT_HOURS } }

export default function Staff() {
  const { staff, services, bookings, saveStaff, deleteStaff } = useData()
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [filter, setFilter] = useState('all') // all | active | busy
  const listRef = useRef(null)

  const active = staff.filter((s) => s.status === 'active').length
  const busyToday = useMemo(
    () => new Set(bookings.filter((b) => b.bookingDate === TODAY && b.status !== 'cancelled').map((b) => b.staffId)),
    [bookings],
  )
  const pick = (f) => { setFilter(f); requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  const shown = staff.filter((s) => (filter === 'all' ? true : filter === 'active' ? s.status === 'active' : busyToday.has(s.id)))

  const toggleDay = (key) => setEditing((e) => {
    const sched = { ...(e.schedule || {}) }
    if (sched[key]) delete sched[key]; else sched[key] = DEFAULT_HOURS
    return { ...e, schedule: sched }
  })
  const toggleService = (id) => setEditing((e) => ({
    ...e, serviceIds: e.serviceIds.includes(id) ? e.serviceIds.filter((x) => x !== id) : [...e.serviceIds, id],
  }))

  const submit = async () => {
    if (!editing.fullName?.trim()) return
    setBusy(true)
    try { const { id, ...data } = editing; await saveStaff(id, data); setEditing(null) }
    catch (e) { alert('บันทึกไม่สำเร็จ: ' + e.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try { await deleteStaff(confirmDel.id); setConfirmDel(null) }
    catch (e) { alert('ลบไม่สำเร็จ: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard icon={Users} label="ช่างทั้งหมด" value={staff.length} sub="ในระบบ" onClick={() => pick('all')} active={filter === 'all'} />
        <StatCard icon={UserCheck} label="พร้อมให้บริการ" value={active} sub="สถานะ active" onClick={() => pick('active')} active={filter === 'active'} />
        <StatCard icon={CalendarClock} label="มีคิววันนี้" value={busyToday.size} sub="ช่างที่มีนัดหมาย" onClick={() => pick('busy')} active={filter === 'busy'} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="serif-display m-0 text-[19px]">รายชื่อช่าง</h3>
          <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>{shown.length} คน · คลิกการ์ดเพื่อแก้ไข</p>
        </div>
        <button type="button" className="btn btn-primary btn-pill" onClick={() => setEditing({ ...empty })}><Plus size={15} /> เพิ่มช่าง</button>
      </div>

      <div ref={listRef} className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', scrollMarginTop: 16 }}>
        {shown.map((s) => {
          const isActive = s.status === 'active'
          const busyNow = busyToday.has(s.id)
          const statusTag = !isActive ? 'tag-neutral' : busyNow ? 'tag-outline' : 'tag-accent'
          const statusText = !isActive ? 'พักงาน' : busyNow ? 'มีคิววันนี้' : 'ว่าง'
          const svcNames = (s.serviceIds || []).map((id) => services.find((x) => x.id === id)?.name).filter(Boolean)
          return (
            <div key={s.id} className="card" style={{ padding: 20, cursor: 'pointer' }}
              onClick={() => setEditing({ ...empty, ...s, serviceIds: s.serviceIds || [], schedule: s.schedule || {} })}>
              <div className="flex items-center justify-between">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] font-display text-[20px] font-semibold"
                  style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-800)' }}>
                  {s.nickname}
                </div>
                <span className={`tag ${statusTag}`}>{statusText}</span>
              </div>
              <p className="serif-display m-0 mt-3 text-[17px]">{s.fullName}</p>
              <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>{s.specialty || '—'}</p>
              <p className="m-0 mt-2 flex items-center gap-[6px] text-[12.5px]" style={{ color: 'var(--color-neutral-600)' }}>
                <Phone size={13} /> {s.phone || '—'}
              </p>
              <p className="m-0 mt-1 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>บริการ: {svcNames.join(', ') || '—'}</p>
              <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setEditing({ ...empty, ...s, serviceIds: s.serviceIds || [], schedule: s.schedule || {} })}><Pencil size={13} /> แก้ไข</button>
                <button type="button" className="btn btn-secondary btn-icon" aria-label="ลบ" onClick={() => setConfirmDel(s)}><Trash2 size={14} /></button>
              </div>
            </div>
          )
        })}
        {staff.length === 0 && <p className="text-[14px]" style={{ color: 'var(--color-neutral-500)' }}>ยังไม่มีช่าง</p>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'แก้ไขช่าง' : 'เพิ่มช่าง'} width={560} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>ยกเลิก</button>
            <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
          </>}>
          <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="ชื่อ-สกุล"><input style={fieldStyle} value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} placeholder="เช่น ช่างเอ" /></Field>
            <Field label="ชื่อเล่น"><input style={fieldStyle} value={editing.nickname} onChange={(e) => setEditing({ ...editing, nickname: e.target.value })} placeholder="เอ" /></Field>
            <Field label="เบอร์โทร"><input style={fieldStyle} value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
            <Field label="ความถนัด"><input style={fieldStyle} value={editing.specialty} onChange={(e) => setEditing({ ...editing, specialty: e.target.value })} placeholder="ต่อเล็บ, เพ้นท์" /></Field>
            <Field label="สถานะ"><select style={fieldStyle} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option value="active">พร้อมให้บริการ</option><option value="inactive">พักงาน</option></select></Field>
            <Field label="วันทำงาน (10:00–19:00)" full>
              <div className="flex flex-wrap gap-2">
                {DOW.map(([key, label]) => (
                  <button key={key} type="button" onClick={() => toggleDay(key)}
                    className={`tag ${editing.schedule?.[key] ? 'tag-accent' : 'tag-neutral'}`} style={{ cursor: 'pointer', padding: '6px 12px' }}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="บริการที่ทำได้" full>
              <div className="grid gap-[6px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {services.map((sv) => (
                  <label key={sv.id} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--color-neutral-700)' }}>
                    <input type="checkbox" checked={editing.serviceIds.includes(sv.id)} onChange={() => toggleService(sv.id)} />
                    {sv.name}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="ลบช่าง" onClose={() => setConfirmDel(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>ยกเลิก</button>
            <button className="btn btn-primary" disabled={busy} onClick={remove}>{busy ? 'กำลังลบ…' : 'ลบ'}</button>
          </>}>
          <p className="m-0 text-[14px]" style={{ color: 'var(--color-neutral-700)' }}>ยืนยันลบช่าง “{confirmDel.fullName}” ใช่ไหม?</p>
        </Modal>
      )}
    </div>
  )
}
