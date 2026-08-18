import { Bell, Clock, MapPin, Phone, Plus, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import StatusTag from '../components/ui/StatusTag.jsx'
import { serviceIcon } from '../lib/icons.js'
import { useBooking } from '../context/BookingContext.jsx'
import { baht, dayNum, monthTH, weekdayTH, TODAY } from '../lib/status.js'

export default function Home() {
  const nav = useNavigate()
  const { myBookings, startBookingWith, services, staff, shop, currentUser } = useBooking()

  const nextBooking = myBookings
    .filter((b) => ['confirmed', 'pending'].includes(b.status) && b.bookingDate >= TODAY)
    .sort((a, b) => (a.bookingDate + a.startTime).localeCompare(b.bookingDate + b.startTime))[0]

  const popular = services.slice(0, 4)
  const goBook = () => { startBookingWith(null); nav('/book') }

  return (
    <div className="pb-7">
      {/* Greeting header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-7">
        <div>
          <p className="text-[13px] muted">สวัสดีค่ะ</p>
          <h1 className="display mt-1 text-2xl">คุณ{currentUser.displayName}</h1>
        </div>
        <div className="flex gap-2.5">
          <button className="icon-btn relative" aria-label="การแจ้งเตือน">
            <Bell size={19} />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full" style={{ background: '#ef8686' }} />
          </button>
          <button className="icon-btn" aria-label="ที่ตั้งร้าน">
            <MapPin size={19} />
          </button>
        </div>
      </div>

      {/* Next appointment */}
      {nextBooking && (
        <section className="px-5 pt-5">
          <p className="mb-2.5 text-[13px] muted">นัดหมายถัดไป</p>
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 shrink-0 text-center">
                <p className="text-[12px] muted">{weekdayTH(nextBooking.bookingDate)}</p>
                <p className="num mt-0.5 text-[32px] leading-none" style={{ color: 'var(--heading)' }}>{dayNum(nextBooking.bookingDate)}</p>
                <p className="mt-1 text-[12px] muted">{monthTH(nextBooking.bookingDate)}</p>
              </div>
              <div className="w-px self-stretch" style={{ background: 'var(--line)' }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="num text-[22px]" style={{ color: 'var(--heading)' }}>{nextBooking.startTime}</p>
                  <StatusTag status={nextBooking.status} />
                </div>
                <p className="mt-2 text-[14px] muted">{nextBooking.items.map((i) => i.name).join(' · ')}</p>
                <p className="mt-1 text-[13px] muted">{nextBooking.staffName}</p>
              </div>
            </div>
            <div className="mt-[18px] flex gap-2">
              <Link to={`/my-bookings/${nextBooking.id}`} className="btn btn-secondary btn-sm flex-1">รายละเอียด</Link>
              <button onClick={goBook} className="btn btn-secondary btn-sm flex-1">จองเพิ่ม</button>
            </div>
          </div>
        </section>
      )}

      {/* Book CTA */}
      <div className="px-5 pt-3.5">
        <button onClick={goBook} className="btn btn-primary btn-block">
          <Plus size={19} /> จองคิวใหม่
        </button>
      </div>

      {/* Popular services */}
      <section className="px-5 pt-7">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="display text-base">บริการยอดนิยม</p>
          <Link to="/services" className="text-[13px]" style={{ color: 'var(--rose)' }}>ทั้งหมด</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {popular.map((s) => {
            const Icon = serviceIcon(s.icon)
            return (
              <button
                key={s.id}
                onClick={() => { startBookingWith(s.id); nav('/book') }}
                className="card p-4 text-left active:scale-[0.99]"
              >
                <span className="tile h-10 w-10"><Icon size={19} /></span>
                <p className="mt-3.5 text-[14px]" style={{ color: 'var(--body)' }}>{s.name}</p>
                <p className="num mt-1.5 text-[19px]" style={{ color: 'var(--heading)' }}>{baht(s.price)}</p>
                <p className="mt-0.5 text-[12px] muted">{s.durationMin} นาที</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Staff */}
      <section className="pt-7">
        <p className="display mb-3 px-5 text-base">ช่างของเรา</p>
        <div className="scroll-x flex gap-2.5 px-5 pb-1">
          {staff.filter((s) => s.status === 'active').map((s) => (
            <div key={s.id} className="card shrink-0 p-4 text-center" style={{ width: 118 }}>
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[15px]" style={{ background: 'var(--rose-soft)', color: 'var(--rose)' }}>
                {s.nickname}
              </span>
              <p className="mt-2.5 text-[14px]" style={{ color: 'var(--body)' }}>{s.fullName}</p>
              <p className="mt-1 inline-flex items-center justify-center gap-1 text-[12px] muted">
                <Star size={12} /> {s.rating}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop info */}
      <section className="px-5 pt-7">
        <div className="card flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3.5">
            <span style={{ color: 'var(--rose-icon)' }}><Clock size={18} /></span>
            <div><p className="text-[12px] muted">เวลาเปิด</p><p className="mt-0.5 text-[14px]" style={{ color: 'var(--body)' }}>{shop.openText}</p></div>
          </div>
          <div className="flex items-center gap-3.5">
            <span style={{ color: 'var(--rose-icon)' }}><MapPin size={18} /></span>
            <div><p className="text-[12px] muted">ที่ตั้ง</p><p className="mt-0.5 text-[14px]" style={{ color: 'var(--body)' }}>{shop.address}</p></div>
          </div>
          <div className="flex items-center gap-3.5">
            <span style={{ color: 'var(--rose-icon)' }}><Phone size={18} /></span>
            <div><p className="text-[12px] muted">โทร</p><p className="mt-0.5 text-[14px]" style={{ color: 'var(--body)' }}>{shop.phone}</p></div>
          </div>
        </div>
      </section>
    </div>
  )
}
