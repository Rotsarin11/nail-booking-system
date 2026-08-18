import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader.jsx'
import { serviceIcon } from '../lib/icons.js'
import { useBooking } from '../context/BookingContext.jsx'
import { baht } from '../lib/status.js'

export default function Services() {
  const nav = useNavigate()
  const { startBookingWith, services } = useBooking()
  const [cat, setCat] = useState('ทั้งหมด')

  const serviceCategories = useMemo(
    () => ['ทั้งหมด', ...Array.from(new Set(services.map((s) => s.category)))],
    [services],
  )
  const list = useMemo(
    () => services.filter((s) => s.isActive !== false && (cat === 'ทั้งหมด' || s.category === cat)),
    [cat, services],
  )

  const book = (id) => { startBookingWith(id); nav('/book') }

  return (
    <div className="flex min-h-[100dvh] flex-col pb-6">
      <AppHeader title="บริการ" subtitle="เลือกบริการเพื่อเริ่มจองคิว" />

      <div className="scroll-x flex gap-2 px-5 pb-4">
        {serviceCategories.map((c) => (
          <button key={c} className={`pill ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5">
        {list.map((s) => {
          const Icon = serviceIcon(s.icon)
          return (
            <button key={s.id} onClick={() => book(s.id)} className="card flex items-center gap-3.5 p-[18px] text-left active:scale-[0.99]">
              <span className="tile h-11 w-11"><Icon size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px]" style={{ color: 'var(--heading)' }}>{s.name}</p>
                <p className="mt-1 truncate text-[13px] muted">{s.description}</p>
                <p className="mt-2 text-[13px] muted">{baht(s.price)} · {s.durationMin} นาที</p>
              </div>
              <span className="icon-btn"><ChevronRight size={17} /></span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
