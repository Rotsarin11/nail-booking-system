import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../../components/layout/AppHeader.jsx'
import StepBar from '../../components/ui/StepBar.jsx'
import { serviceIcon } from '../../lib/icons.js'
import { useBooking } from '../../context/BookingContext.jsx'
import { minToTime, timeToMin } from '../../lib/slots.js'
import { baht, dateTHLong } from '../../lib/status.js'

export default function BookConfirm() {
  const nav = useNavigate()
  const { draft, selectedServices, totalPrice, totalMinutes, setNote, confirmBooking, staff, currentUser } = useBooking()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!draft.time || draft.serviceIds.length === 0) nav('/book', { replace: true })
  }, [draft.time, draft.serviceIds.length, nav])

  const pickedStaff = draft.staffId === 'any' ? null : staff.find((s) => s.id === draft.staffId)
  const staffLabel = pickedStaff ? pickedStaff.fullName : 'จัดช่างให้อัตโนมัติ'
  const endTime = draft.time ? minToTime(timeToMin(draft.time) + totalMinutes) : ''

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const booking = await confirmBooking()
      nav(`/booking-success/${booking.id}`, { replace: true })
    } catch (e) {
      setError(e.message || 'จองไม่สำเร็จ กรุณาลองใหม่')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader title="ตรวจสอบและยืนยัน" back right={<span className="text-[13px] muted">4 / 4</span>} />
      <StepBar current={4} />

      <div className="flex flex-1 flex-col gap-3 px-5 pb-4 pt-5">
        {/* When / who */}
        <div className="card p-5">
          <p className="text-[13px] muted">{dateTHLong(draft.date)}</p>
          <p className="num mt-2 text-[30px]" style={{ color: 'var(--heading)' }}>{draft.time}</p>
          <p className="mt-1.5 text-[14px] muted">{staffLabel} · เสร็จราว {endTime}</p>
        </div>

        {/* Services */}
        <div className="card p-5">
          <p className="mb-3.5 text-[13px] muted">รายการบริการ</p>
          <div className="flex flex-col gap-3">
            {selectedServices.map((s) => {
              const Icon = serviceIcon(s.icon)
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="tile h-[34px] w-[34px]"><Icon size={16} /></span>
                  <span className="flex-1 text-[14px]" style={{ color: 'var(--body)' }}>{s.name}</span>
                  <span className="num text-[14px] muted">{baht(s.price)}</span>
                </div>
              )
            })}
          </div>
          <div className="divider my-4" />
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] muted">ยอดรวม</span>
            <span className="num text-[24px]" style={{ color: 'var(--heading)' }}>{baht(totalPrice)}</span>
          </div>
        </div>

        {/* Note */}
        <div className="card p-5">
          <label className="field-label" htmlFor="note">หมายเหตุถึงร้าน</label>
          <textarea
            id="note"
            className="field"
            rows={3}
            placeholder="เช่น ขอโทนสีชมพู · แพ้น้ำยาบางชนิด"
            value={draft.note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-xl px-4 py-3 text-[13px]" style={{ background: '#fdecec', color: '#a3402f' }}>{error}</p>
        )}

        <p className="px-1 text-[12px] muted">
          จองในนาม {currentUser.fullName} · {currentUser.phone} — คำขอจะถูกส่งให้ร้านตรวจสอบ สถานะเริ่มต้น “รอยืนยัน”
        </p>
      </div>

      <div className="action-bar">
        <button className="btn btn-primary btn-block" disabled={submitting} onClick={submit}>
          {submitting ? <><Loader2 size={18} className="animate-spin" /> กำลังส่งคำขอ…</> : 'ยืนยันการจอง'}
        </button>
      </div>
    </div>
  )
}
