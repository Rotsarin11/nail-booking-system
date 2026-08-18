import { useEffect, useState } from 'react'
import { Store, Clock3, Bell, Save, Check } from 'lucide-react'
import Corners from '../components/ui/Corners'
import { Field, fieldStyle } from '../components/ui/Modal'
import { useData } from '../context/DataContext'

function Toggle({ on, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      style={{ position: 'relative', width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', flex: 'none',
        background: on ? 'var(--color-accent-600)' : 'var(--color-neutral-300)', transition: 'background 0.2s ease' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  )
}

const DEFAULTS = {
  name: 'Take Care Nail', phone: '098-145-0399', address: 'ถ.นิมมานเหมินท์ ซ.9 อ.เมือง จ.เชียงใหม่',
  openTime: '10:00', closeTime: '19:00', lineId: '@takecarenail',
  notifyConfirm: true, notifyReminder: true,
}

export default function Settings() {
  const { settings, saveSettings } = useData()
  const [form, setForm] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (settings && Object.keys(settings).length) setForm((f) => ({ ...f, ...settings }))
  }, [settings])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const save = async () => {
    setBusy(true)
    try {
      const { id, updatedAt, ...data } = form
      await saveSettings(data)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { alert('บันทึกไม่สำเร็จ: ' + e.message) } finally { setBusy(false) }
  }

  const Section = ({ icon: Icon, title, children }) => (
    <div className="card blueprint" style={{ padding: 20 }}>
      <Corners />
      <div className="mb-4 flex items-center gap-[10px]">
        <span className="stat-icon" style={{ width: 34, height: 34, borderRadius: 10 }}><Icon size={16} /></span>
        <h3 className="serif-display m-0 text-[18px]">{title}</h3>
      </div>
      {children}
    </div>
  )

  return (
    <div className="flex flex-col gap-[22px]">
      <Section icon={Store} title="ข้อมูลร้าน">
        <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Field label="ชื่อร้าน"><input style={fieldStyle} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="เบอร์โทร"><input style={fieldStyle} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="ที่อยู่" full><input style={fieldStyle} value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
          <Field label="LINE Official ID"><input style={fieldStyle} value={form.lineId} onChange={(e) => set('lineId', e.target.value)} /></Field>
        </div>
      </Section>

      <Section icon={Clock3} title="เวลาทำการ">
        <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Field label="เวลาเปิด"><input type="time" style={fieldStyle} value={form.openTime} onChange={(e) => set('openTime', e.target.value)} /></Field>
          <Field label="เวลาปิด"><input type="time" style={fieldStyle} value={form.closeTime} onChange={(e) => set('closeTime', e.target.value)} /></Field>
        </div>
        <p className="m-0 mt-3 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>ใช้เป็นกรอบเวลาให้ระบบคำนวณช่วงจองที่ว่าง</p>
      </Section>

      <Section icon={Bell} title="การแจ้งเตือน">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="mr-auto">
              <p className="m-0 text-[14px] font-medium">แจ้งเตือนเมื่อยืนยันการจอง</p>
              <p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>ส่งข้อความ LINE ให้ลูกค้าเมื่อร้านยืนยันคิว</p>
            </div>
            <Toggle on={form.notifyConfirm} onClick={() => set('notifyConfirm', !form.notifyConfirm)} />
          </div>
          <div className="flex items-center gap-3">
            <div className="mr-auto">
              <p className="m-0 text-[14px] font-medium">แจ้งเตือนก่อนถึงนัด</p>
              <p className="m-0 text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>เตือนล่วงหน้า 1 วันก่อนถึงคิว</p>
            </div>
            <Toggle on={form.notifyReminder} onClick={() => set('notifyReminder', !form.notifyReminder)} />
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy} onClick={save}><Save size={15} /> {busy ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า'}</button>
        {saved && <span className="inline-flex items-center gap-1 text-[13px]" style={{ color: 'var(--color-accent-800)' }}><Check size={14} /> บันทึกแล้ว</span>}
      </div>
    </div>
  )
}
