import { Check } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import StatusTag from '../../components/ui/StatusTag.jsx'
import { useBooking } from '../../context/BookingContext.jsx'
import { baht, dateTHLong } from '../../lib/status.js'

export default function BookSuccess() {
  const { id } = useParams()
  const nav = useNavigate()
  const { myBookings } = useBooking()
  const booking = myBookings.find((b) => b.id === id)

  if (!booking) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="muted">ไม่พบข้อมูลการจอง</p>
        <button className="btn btn-primary" onClick={() => nav('/')}>กลับหน้าแรก</button>
      </div>
    )
  }

  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between">
      <span className="muted">{label}</span>
      <span style={{ color: 'var(--body)' }}>{children}</span>
    </div>
  )

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 pb-7 pt-20">
      <span className="check-pop flex h-[72px] w-[72px] items-center justify-center rounded-full" style={{ background: 'var(--rose-soft)', color: 'var(--rose)' }}>
        <Check size={32} />
      </span>
      <h1 className="display mt-[26px] text-[26px]">ส่งคำขอจองแล้ว</h1>
      <p className="mt-2.5 text-[14px] leading-relaxed muted">
        ร้านกำลังตรวจสอบคำขอของคุณ<br />เราจะแจ้งเตือนผ่าน LINE เมื่อยืนยันคิวแล้ว
      </p>

      <div className="pop-in card mt-[30px] p-[22px]">
        <p className="text-[13px] muted">{dateTHLong(booking.bookingDate)}</p>
        <p className="num mt-2 text-[32px]" style={{ color: 'var(--heading)' }}>{booking.startTime}</p>
        <div className="divider my-[18px]" />
        <div className="flex flex-col gap-3 text-[14px]">
          <Row label="ช่าง">{booking.staffName}</Row>
          <Row label="บริการ">{booking.items.map((i) => i.name).join(' · ')}</Row>
          <Row label="ยอดรวม"><span className="num">{baht(booking.totalPrice)}</span></Row>
          <div className="flex items-center justify-between">
            <span className="muted">สถานะ</span>
            <StatusTag status={booking.status} />
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-8">
        <Link to={`/my-bookings/${booking.id}`} className="btn btn-primary btn-block">ดูรายละเอียดนัด</Link>
        <Link to="/" className="btn btn-secondary btn-block">กลับหน้าแรก</Link>
      </div>
    </div>
  )
}
