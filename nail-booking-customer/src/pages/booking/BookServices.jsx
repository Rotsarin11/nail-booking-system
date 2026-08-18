import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../../components/layout/AppHeader.jsx'
import StepBar from '../../components/ui/StepBar.jsx'
import ServiceCard from '../../components/ui/ServiceCard.jsx'
import { useBooking } from '../../context/BookingContext.jsx'
import { baht } from '../../lib/status.js'

export default function BookServices() {
  const nav = useNavigate()
  const { draft, toggleService, totalPrice, totalMinutes, services } = useBooking()
  const [cat, setCat] = useState('ทั้งหมด')

  const serviceCategories = useMemo(
    () => ['ทั้งหมด', ...Array.from(new Set(services.map((s) => s.category)))],
    [services],
  )
  const list = useMemo(
    () => services.filter((s) => s.isActive !== false && (cat === 'ทั้งหมด' || s.category === cat)),
    [cat, services],
  )
  const count = draft.serviceIds.length

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader title="เลือกบริการ" back right={<span className="text-[13px] muted">1 / 4</span>} />
      <StepBar current={1} />

      <div className="scroll-x flex gap-2 px-5 pb-3.5 pt-5">
        {serviceCategories.map((c) => (
          <button key={c} className={`pill ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-4">
        {list.map((s) => (
          <ServiceCard key={s.id} service={s} selected={draft.serviceIds.includes(s.id)} onToggle={() => toggleService(s.id)} />
        ))}
      </div>

      <div className="action-bar">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[13px] muted">{count > 0 ? `${count} บริการ · ${totalMinutes} นาที` : 'ยังไม่ได้เลือกบริการ'}</span>
          <span className="num text-[22px]" style={{ color: 'var(--heading)' }}>{baht(totalPrice)}</span>
        </div>
        <button className="btn btn-primary btn-block" disabled={count === 0} onClick={() => nav('/book/staff')}>ถัดไป</button>
      </div>
    </div>
  )
}
