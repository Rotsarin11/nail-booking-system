import { useEffect, useMemo, useState } from 'react'
import { CalendarX, Clock, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../../components/layout/AppHeader.jsx'
import StepBar from '../../components/ui/StepBar.jsx'
import { useBooking } from '../../context/BookingContext.jsx'
import { monthYearTH, weekdayTH } from '../../lib/status.js'

export default function BookDateTime() {
  const nav = useNavigate()
  const { draft, setDate, setTime, totalMinutes, staff, availability, days: getDays } = useBooking()

  useEffect(() => {
    if (draft.serviceIds.length === 0) nav('/book', { replace: true })
  }, [draft.serviceIds.length, nav])

  const days = useMemo(() => getDays(14), [getDays])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)

  // Load availability whenever the chosen date changes (API or local).
  useEffect(() => {
    if (!draft.date) { setSlots([]); return }
    let alive = true
    setLoading(true)
    availability(draft.date)
      .then((s) => { if (alive) setSlots(s) })
      .catch(() => { if (alive) setSlots([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.date, draft.staffId, draft.serviceIds.join(',')])

  const hasAvailable = slots.some((s) => s.available)
  const selStaffName = draft.staffId === 'any' ? 'จัดให้อัตโนมัติ' : staff.find((s) => s.id === draft.staffId)?.fullName
  const endTime = slots.find((x) => x.time === draft.time)?.endTime

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader title="วันและเวลา" back right={<span className="text-[13px] muted">3 / 4</span>} />
      <StepBar current={3} />

      {/* Day strip */}
      <div className="pt-5">
        <p className="mb-3 px-5 text-[13px] muted">{monthYearTH((draft.date || days[0]?.key))}</p>
        <div className="scroll-x flex gap-2 px-5 pb-1">
          {days.map((d) => {
            const active = draft.date === d.key
            return (
              <button key={d.key} disabled={d.shopClosed} onClick={() => setDate(d.key)} className={`day-cell ${active ? 'active' : ''}`}>
                <p className="text-[11px]" style={{ opacity: 0.75 }}>{weekdayTH(d.key)}</p>
                <p className="num mt-1 text-[19px] leading-none">{d.day}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 px-5 pb-4 pt-7">
        <div className="mb-3.5 flex items-baseline justify-between">
          <p className="text-[13px] muted">เวลาที่ว่าง</p>
          <p className="text-[12px] muted">ใช้เวลา {totalMinutes} นาที</p>
        </div>
        {!draft.date ? (
          <p className="rounded-2xl p-8 text-center text-[14px] muted" style={{ background: '#eef5fd' }}>กรุณาเลือกวันก่อน</p>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl p-8 text-[14px] muted" style={{ background: '#eef5fd' }}>
            <Loader2 size={18} className="animate-spin" /> กำลังตรวจเวลาว่าง…
          </div>
        ) : !hasAvailable ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl p-8 text-center" style={{ background: '#eef5fd' }}>
            <CalendarX size={26} style={{ color: '#a9bdd8' }} />
            <p className="text-[14px] muted">วันนี้ไม่มีช่วงเวลาว่าง<br />ลองเลือกวันอื่นดูนะคะ</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-[9px]">
            {slots.map((s) => (
              <button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)} className={`slot ${draft.time === s.time ? 'active' : ''}`}>
                {s.time}
              </button>
            ))}
          </div>
        )}
        {draft.time && (
          <p className="mt-[18px] inline-flex items-center gap-2 text-[13px] muted">
            <Clock size={15} style={{ color: 'var(--rose-icon)' }} /> {draft.time} – {endTime} น. กับ{selStaffName}
          </p>
        )}
      </div>

      <div className="action-bar">
        <button className="btn btn-primary btn-block" disabled={!draft.time} onClick={() => nav('/book/confirm')}>ถัดไป</button>
      </div>
    </div>
  )
}
