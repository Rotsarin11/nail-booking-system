import { useEffect } from 'react'
import { Check, Star, WandSparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../../components/layout/AppHeader.jsx'
import StepBar from '../../components/ui/StepBar.jsx'
import { useBooking } from '../../context/BookingContext.jsx'
import { qualifiedStaff } from '../../lib/slots.js'

export default function BookStaff() {
  const nav = useNavigate()
  const { draft, setStaff, staff } = useBooking()

  useEffect(() => {
    if (draft.serviceIds.length === 0) nav('/book', { replace: true })
  }, [draft.serviceIds.length, nav])

  const eligible = qualifiedStaff(staff, draft.serviceIds)

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader title="เลือกช่าง" back right={<span className="text-[13px] muted">2 / 4</span>} />
      <StepBar current={2} />

      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-4 pt-5">
        {/* Any staff */}
        <button
          onClick={() => setStaff('any')}
          className={`card ${draft.staffId === 'any' ? 'card-selected' : ''} flex items-center gap-3.5 p-[18px] text-left`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--rose-soft)', color: 'var(--rose)' }}>
            <WandSparkles size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px]" style={{ color: 'var(--heading)' }}>ไม่ระบุช่าง</p>
            <p className="mt-1 text-[13px] muted">ระบบเลือกช่างที่ว่างให้อัตโนมัติ</p>
          </div>
          <span
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
            style={{ background: draft.staffId === 'any' ? 'var(--rose)' : 'transparent', border: draft.staffId === 'any' ? 'none' : '1px solid var(--edge)', color: '#fff' }}
          >
            {draft.staffId === 'any' && <Check size={14} />}
          </span>
        </button>

        {eligible.map((s) => {
          const active = draft.staffId === s.id
          return (
            <button
              key={s.id}
              onClick={() => setStaff(s.id)}
              className={`card ${active ? 'card-selected' : ''} flex items-center gap-3.5 p-[18px] text-left`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px]" style={{ background: 'var(--rose-tile)', color: 'var(--rose)' }}>
                {s.nickname}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px]" style={{ color: 'var(--heading)' }}>{s.fullName}</p>
                <p className="mt-1 text-[13px] muted">{s.specialty}</p>
              </div>
              <span className="flex items-center gap-1 text-[13px] muted">
                <Star size={13} style={{ color: 'var(--rose-icon)' }} />{s.rating}
              </span>
              <span
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
                style={{ background: active ? 'var(--rose)' : 'transparent', border: active ? 'none' : '1px solid var(--edge)', color: '#fff' }}
              >
                {active && <Check size={14} />}
              </span>
            </button>
          )
        })}

        {eligible.length === 0 && (
          <p className="rounded-2xl p-5 text-center text-[14px] muted" style={{ background: '#eef5fd' }}>
            ไม่มีช่างที่ให้บริการครบทุกรายการที่เลือก ลองปรับบริการอีกครั้ง
          </p>
        )}
      </div>

      <div className="action-bar">
        <button className="btn btn-primary btn-block" onClick={() => nav('/book/datetime')}>ถัดไป</button>
      </div>
    </div>
  )
}
