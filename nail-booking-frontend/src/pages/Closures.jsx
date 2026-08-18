import { useMemo, useRef, useState } from 'react'
import { CalendarOff, Store, UserMinus, Plus, Trash2 } from 'lucide-react'
import Corners from '../components/ui/Corners'
import StatCard from '../components/dashboard/StatCard'
import Modal, { Field, fieldStyle } from '../components/ui/Modal'
import { useData } from '../context/DataContext'
import { TODAY } from '../data/mockData'

const DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const dateFmt = (key) => {
  if (!key) return '—'
  const [y, m, d] = key.split('-').map(Number)
  const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return `${d} ${TH[m - 1]} ${(y + 543) % 100}`
}

export default function Closures() {
  const { closures, staff, addClosure, removeClosure } = useData()
  const [adding, setAdding] = useState(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('all') // all | shop | leave
  const listRef = useRef(null)
  const pick = (f) => { setFilter(f); requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }

  const stats = {
    total: closures.length,
    shop: closures.filter((c) => !c.staffId).length,
    leave: closures.filter((c) => c.staffId).length,
  }

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const marks = useMemo(() => {
    const m = {}
    closures.forEach((c) => { m[c.closureDate] = c.staffId ? 'leave' : 'shop' })
    return m
  }, [closures])

  const cells = useMemo(() => {
    const first = new Date(year, month, 1).getDay()
    const days = new Date(year, month + 1, 0).getDate()
    const out = []
    for (let i = 0; i < first; i++) out.push(null)
    for (let d = 1; d <= days; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      out.push({ d, type: marks[key], isToday: d === today.getDate() })
    }
    return out
  }, [year, month, marks])

  const rows = [...closures]
    .filter((c) => (filter === 'all' ? true : filter === 'shop' ? !c.staffId : !!c.staffId))
    .sort((a, b) => (a.closureDate || '').localeCompare(b.closureDate || ''))
  const staffName = (id) => staff.find((s) => s.id === id)?.fullName || 'ทั้งร้าน'

  const openAdd = () => setAdding({ closureDate: TODAY, kind: 'shop', staffId: '', reason: '' })
  const submit = async () => {
    if (!adding.closureDate) return
    setBusy(true)
    try {
      await addClosure({
        closureDate: adding.closureDate,
        staffId: adding.kind === 'leave' ? (adding.staffId || null) : null,
        reason: adding.reason,
      })
      setAdding(null)
    } catch (e) { alert('บันทึกไม่สำเร็จ: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard icon={CalendarOff} label="รายการทั้งหมด" value={stats.total} sub="วันหยุด + วันลา" onClick={() => pick('all')} active={filter === 'all'} />
        <StatCard icon={Store} label="ปิดร้าน" value={stats.shop} sub="ทั้งร้าน" onClick={() => pick('shop')} active={filter === 'shop'} />
        <StatCard icon={UserMinus} label="ช่างลา" value={stats.leave} sub="รายบุคคล" onClick={() => pick('leave')} active={filter === 'leave'} />
      </div>

      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-2">
        {/* calendar */}
        <div className="card blueprint" style={{ padding: 20 }}>
          <Corners />
          <h3 className="serif-display m-0 text-[19px]">ปฏิทินเดือนนี้</h3>
          <div className="mt-3 grid grid-cols-7 gap-[6px] text-center">
            {DOW.map((d) => <div key={d} className="text-[11px]" style={{ color: 'var(--color-neutral-500)' }}>{d}</div>)}
            {cells.map((c, i) => (
              <div key={i} className="flex h-[38px] items-center justify-center rounded-[8px] text-[13px]"
                style={{
                  background: c?.type === 'shop' ? 'var(--color-accent-200)' : c?.type === 'leave' ? 'var(--color-accent-2-200)' : 'transparent',
                  border: c?.isToday ? '1px solid var(--color-accent)' : '1px solid transparent',
                  color: c ? 'var(--color-text)' : 'transparent',
                }}>
                {c?.d}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>
            <span className="flex items-center gap-[6px]"><span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-accent-200)' }} /> ปิดร้าน</span>
            <span className="flex items-center gap-[6px]"><span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-accent-2-200)' }} /> ช่างลา</span>
          </div>
        </div>

        {/* list */}
        <div ref={listRef} className="card blueprint" style={{ padding: 0, overflow: 'hidden', scrollMarginTop: 16 }}>
          <Corners />
          <div className="flex items-center gap-3 px-[22px] pb-[14px] pt-[18px]">
            <h3 className="serif-display m-0 mr-auto text-[19px]">รายการวันหยุด/วันลา</h3>
            <button type="button" className="btn btn-primary btn-pill" onClick={openAdd}><Plus size={15} /> เพิ่ม</button>
          </div>
          <div className="flex flex-col">
            {rows.map((c) => (
              <div key={c.id} className="apt-row flex items-center gap-3 px-[22px] py-[13px]" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
                <span className={`tag ${c.staffId ? 'tag-outline' : 'tag-accent'}`}>{c.staffId ? 'ช่างลา' : 'ปิดร้าน'}</span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[14px] font-medium">{dateFmt(c.closureDate)} · {c.staffId ? staffName(c.staffId) : 'ทั้งร้าน'}</p>
                  <p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>{c.reason || '—'}</p>
                </div>
                <button type="button" className="btn btn-secondary btn-icon" aria-label="ลบ" onClick={() => removeClosure(c.id)}><Trash2 size={14} /></button>
              </div>
            ))}
            {rows.length === 0 && <p className="px-[22px] py-8 text-center text-[13px]" style={{ color: 'var(--color-neutral-500)' }}>ยังไม่มีรายการ</p>}
          </div>
        </div>
      </div>

      {adding && (
        <Modal title="เพิ่มวันหยุด / วันลา" onClose={() => setAdding(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setAdding(null)}>ยกเลิก</button>
            <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
          </>}>
          <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="ประเภท"><select style={fieldStyle} value={adding.kind} onChange={(e) => setAdding({ ...adding, kind: e.target.value })}><option value="shop">ปิดร้านทั้งวัน</option><option value="leave">ช่างลา</option></select></Field>
            <Field label="วันที่"><input type="date" style={fieldStyle} value={adding.closureDate} onChange={(e) => setAdding({ ...adding, closureDate: e.target.value })} /></Field>
            {adding.kind === 'leave' && (
              <Field label="ช่าง" full>
                <select style={fieldStyle} value={adding.staffId} onChange={(e) => setAdding({ ...adding, staffId: e.target.value })}>
                  <option value="">— เลือกช่าง —</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
              </Field>
            )}
            <Field label="เหตุผล" full><input style={fieldStyle} value={adding.reason} onChange={(e) => setAdding({ ...adding, reason: e.target.value })} placeholder="เช่น หยุดประจำสัปดาห์ / ลาป่วย" /></Field>
          </div>
        </Modal>
      )}
    </div>
  )
}
