import { useState } from 'react'
import { Hash, MapPin, MessageSquare, Navigation, User } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader.jsx'
import StatusTag from '../components/ui/StatusTag.jsx'
import { serviceIcon } from '../lib/icons.js'
import { useBooking } from '../context/BookingContext.jsx'
import { baht, dateTHLong, TODAY } from '../lib/status.js'

export default function BookingDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { myBookings, cancelBooking, services: allServices, shop } = useBooking()
  const [confirming, setConfirming] = useState(false)

  const b = myBookings.find((x) => x.id === id)
  if (!b) {
    return (
      <div>
        <AppHeader title="รายละเอียดนัด" back />
        <p className="p-10 text-center muted">ไม่พบข้อมูลการจอง</p>
      </div>
    )
  }

  const canCancel = ['pending', 'confirmed'].includes(b.status) && b.bookingDate >= TODAY
  const iconFor = (sid) => serviceIcon(allServices.find((s) => s.id === sid)?.icon)

  const Row = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 text-[14px]">
      <span style={{ color: 'var(--rose-icon)' }}><Icon size={17} /></span>
      <span className="flex-1 muted">{label}</span>
      <span style={{ color: 'var(--body)' }}>{value}</span>
    </div>
  )

  return (
    <div className="flex min-h-[100dvh] flex-col pb-6">
      <AppHeader title="รายละเอียดนัด" back />

      <div className="flex flex-col gap-3 px-5 pt-3">
        {/* Summary */}
        <div className="card p-[22px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] muted">{dateTHLong(b.bookingDate)}</p>
              <p className="num mt-2 text-[30px]" style={{ color: 'var(--heading)' }}>{b.startTime} – {b.endTime}</p>
            </div>
            <StatusTag status={b.status} />
          </div>
          {b.status === 'cancelled' && b.cancelReason && (
            <div className="mt-4 rounded-[13px] p-3.5 text-[13px]" style={{ background: '#fdecec', color: '#a3402f' }}>
              <span style={{ opacity: 0.75 }}>เหตุผลที่ยกเลิก: </span>{b.cancelReason}
              {b.cancelledBy === 'admin' && <span style={{ opacity: 0.75 }}> (โดยร้าน)</span>}
            </div>
          )}
          <div className="divider my-5" />
          <div className="flex flex-col gap-3.5">
            <Row icon={User} label="ช่าง" value={b.staffName} />
            {b.note && <Row icon={MessageSquare} label="หมายเหตุ" value={b.note} />}
            <Row icon={Hash} label="รหัสการจอง" value={<span className="num">{b.id}</span>} />
          </div>
        </div>

        {/* Services */}
        <div className="card p-5">
          <p className="mb-3.5 text-[13px] muted">รายการบริการ</p>
          <div className="flex flex-col gap-3">
            {b.items.map((it, i) => {
              const Icon = iconFor(it.serviceId)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="tile h-[34px] w-[34px]"><Icon size={16} /></span>
                  <span className="flex-1 text-[14px]" style={{ color: 'var(--body)' }}>{it.name}</span>
                  <span className="num text-[14px] muted">{baht(it.priceSnapshot)}</span>
                </div>
              )
            })}
          </div>
          <div className="divider my-4" />
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] muted">ยอดรวม</span>
            <span className="num text-[24px]" style={{ color: 'var(--heading)' }}>{baht(b.totalPrice)}</span>
          </div>
        </div>

        {/* Location */}
        <div className="card flex items-center gap-3.5 p-[18px]">
          <span className="tile h-[38px] w-[38px]"><MapPin size={17} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px]" style={{ color: 'var(--body)' }}>{shop.name}</p>
            <p className="mt-0.5 text-[12px] muted">{shop.address}</p>
          </div>
          <span className="icon-btn"><Navigation size={15} /></span>
        </div>

        {canCancel && !confirming && (
          <button className="btn btn-secondary btn-block mt-1" onClick={() => setConfirming(true)}>ยกเลิกการจอง</button>
        )}
        {confirming && (
          <div className="card p-5 pop-in">
            <p className="text-[14px]" style={{ color: 'var(--body)' }}>ยืนยันการยกเลิกนัดนี้ใช่ไหมคะ?</p>
            <div className="mt-3.5 flex gap-2">
              <button className="btn btn-secondary btn-sm flex-1" onClick={() => setConfirming(false)}>ไม่ใช่</button>
              <button className="btn btn-primary btn-sm flex-1" onClick={() => { cancelBooking(b.id); setConfirming(false) }}>ยืนยันยกเลิก</button>
            </div>
          </div>
        )}

        {b.status === 'completed' && (
          <button className="btn btn-primary btn-block mt-1" onClick={() => nav('/book')}>จองบริการนี้อีกครั้ง</button>
        )}
      </div>
    </div>
  )
}
