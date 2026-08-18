import { useMemo, useRef, useState } from 'react'
import { Sparkles, Tag, Clock3, Wallet, Plus, Pencil, Trash2 } from 'lucide-react'
import Corners from '../components/ui/Corners'
import StatCard from '../components/dashboard/StatCard'
import Modal, { Field, fieldStyle } from '../components/ui/Modal'
import { useData } from '../context/DataContext'
import { baht } from '../lib/status'

const empty = { name: '', category: '', description: '', durationMin: 60, bufferMin: 10, price: 0, isActive: true }

export default function Services() {
  const { services, saveService, deleteService } = useData()
  const [cat, setCat] = useState('ทั้งหมด')
  const [editing, setEditing] = useState(null) // {id?, ...form} or null
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const listRef = useRef(null)
  const goList = (c) => { if (c) setCat(c); requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }

  const categories = useMemo(
    () => ['ทั้งหมด', ...Array.from(new Set(services.map((s) => s.category).filter(Boolean)))],
    [services],
  )
  const rows = useMemo(
    () => services.filter((s) => (cat === 'ทั้งหมด' ? true : s.category === cat)),
    [cat, services],
  )

  const activeCount = services.filter((s) => s.isActive !== false).length
  const avgPrice = services.length ? Math.round(services.reduce((s, x) => s + (x.price || 0), 0) / services.length) : 0
  const avgDur = services.length ? Math.round(services.reduce((s, x) => s + (x.durationMin || 0), 0) / services.length) : 0

  const submit = async () => {
    if (!editing.name?.trim()) return
    setBusy(true)
    try {
      const { id, ...data } = editing
      await saveService(id, data)
      setEditing(null)
    } catch (e) { alert('บันทึกไม่สำเร็จ: ' + e.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try { await deleteService(confirmDel.id); setConfirmDel(null) }
    catch (e) { alert('ลบไม่สำเร็จ: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard icon={Sparkles} label="บริการทั้งหมด" value={services.length} sub={`เปิดใช้ ${activeCount} รายการ`} onClick={() => goList('ทั้งหมด')} />
        <StatCard icon={Tag} label="หมวดหมู่" value={Math.max(categories.length - 1, 0)} sub="ประเภทบริการ" onClick={() => goList()} />
        <StatCard icon={Clock3} label="เวลาเฉลี่ย" value={`${avgDur} นาที`} sub="ต่อการบริการ" onClick={() => goList()} />
        <StatCard icon={Wallet} label="ราคาเฉลี่ย" value={baht(avgPrice)} sub="ต่อรายการ" onClick={() => goList()} />
      </div>

      <div ref={listRef} className="card blueprint" style={{ padding: 0, overflow: 'hidden', scrollMarginTop: 16 }}>
        <Corners />
        <div className="flex flex-wrap items-center gap-3 px-[22px] pb-[14px] pt-[18px]">
          <div className="mr-auto">
            <h3 className="serif-display m-0 text-[19px]">รายการบริการ</h3>
            <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>{rows.length} รายการ</p>
          </div>
          <button type="button" className="btn btn-primary btn-pill" onClick={() => setEditing({ ...empty })}><Plus size={15} /> เพิ่มบริการ</button>
        </div>

        <div className="flex flex-wrap gap-2 px-[22px] pb-[14px]">
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)}
              className={`tag ${cat === c ? 'tag-accent' : 'tag-neutral'}`}
              style={{ cursor: 'pointer', padding: '5px 12px', borderRadius: 999 }}>
              {c}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto scroll-thin">
          <table className="table" style={{ minWidth: 760 }}>
            <thead>
              <tr><th>บริการ</th><th>หมวดหมู่</th><th>เวลา</th><th>ราคา</th><th>สถานะ</th><th>จัดการ</th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="apt-row" style={{ cursor: 'pointer' }} onClick={() => setEditing({ ...empty, ...s })}>
                  <td>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>{s.description}</div>
                  </td>
                  <td style={{ color: 'var(--color-neutral-600)' }}>{s.category}</td>
                  <td className="whitespace-nowrap">{s.durationMin} นาที{s.bufferMin ? ` +${s.bufferMin}` : ''}</td>
                  <td className="whitespace-nowrap font-semibold">{baht(s.price)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => saveService(s.id, { isActive: !(s.isActive !== false) })}
                      className={`tag ${s.isActive !== false ? 'tag-accent' : 'tag-neutral'}`} style={{ cursor: 'pointer' }}>
                      {s.isActive !== false ? 'เปิดใช้' : 'ปิด'}
                    </button>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-secondary btn-icon" aria-label="แก้ไข" onClick={() => setEditing({ ...empty, ...s })}><Pencil size={14} /></button>
                      <button type="button" className="btn btn-secondary btn-icon" aria-label="ลบ" onClick={() => setConfirmDel(s)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center" style={{ color: 'var(--color-neutral-500)' }}>ยังไม่มีบริการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'แก้ไขบริการ' : 'เพิ่มบริการ'}
          onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>ยกเลิก</button>
            <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
          </>}
        >
          <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="ชื่อบริการ" full><input style={fieldStyle} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="เช่น ทาสีเจล" /></Field>
            <Field label="หมวดหมู่"><input style={fieldStyle} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="เช่น ทาสี" /></Field>
            <Field label="ราคา (บาท)"><input type="number" style={fieldStyle} value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></Field>
            <Field label="เวลาให้บริการ (นาที)"><input type="number" style={fieldStyle} value={editing.durationMin} onChange={(e) => setEditing({ ...editing, durationMin: e.target.value })} /></Field>
            <Field label="เวลากันชน (นาที)"><input type="number" style={fieldStyle} value={editing.bufferMin} onChange={(e) => setEditing({ ...editing, bufferMin: e.target.value })} /></Field>
            <Field label="รายละเอียด" full><textarea rows={2} style={{ ...fieldStyle, resize: 'none' }} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <label className="flex items-center gap-2" style={{ gridColumn: '1 / -1' }}>
              <input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              <span className="text-[13px]" style={{ color: 'var(--color-neutral-700)' }}>เปิดให้จองบริการนี้</span>
            </label>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="ลบบริการ" onClose={() => setConfirmDel(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>ยกเลิก</button>
            <button className="btn btn-primary" disabled={busy} onClick={remove}>{busy ? 'กำลังลบ…' : 'ลบ'}</button>
          </>}>
          <p className="m-0 text-[14px]" style={{ color: 'var(--color-neutral-700)' }}>ยืนยันลบบริการ “{confirmDel.name}” ใช่ไหม? การจองเดิมจะไม่ได้รับผลกระทบ</p>
        </Modal>
      )}
    </div>
  )
}
