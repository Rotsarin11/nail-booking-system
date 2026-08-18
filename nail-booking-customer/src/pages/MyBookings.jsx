import { useMemo, useState } from 'react'
import { CalendarCheck, ChevronRight, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader.jsx'
import StatusTag from '../components/ui/StatusTag.jsx'
import { useBooking } from '../context/BookingContext.jsx'
import { baht, dayNum, monthTH, weekdayTH, TODAY } from '../lib/status.js'

export default function MyBookings() {
  const nav = useNavigate()
  const { myBookings, startBookingWith } = useBooking()
  const [tab, setTab] = useState('upcoming')

  const { upcoming, history } = useMemo(() => {
    const sorted = [...myBookings].sort((a, b) => (b.bookingDate + b.startTime).localeCompare(a.bookingDate + a.startTime))
    const up = sorted
      .filter((b) => ['confirmed', 'pending'].includes(b.status) && b.bookingDate >= TODAY)
      .sort((a, b) => (a.bookingDate + a.startTime).localeCompare(b.bookingDate + b.startTime))
    const hist = sorted.filter((b) => !up.includes(b))
    return { upcoming: up, history: hist }
  }, [myBookings])

  const list = tab === 'upcoming' ? upcoming : history
  const goBook = () => { startBookingWith(null); nav('/book') }

  return (
    <div className="flex min-h-[100dvh] flex-col pb-6">
      <AppHeader
        title="นัดของฉัน"
        subtitle={`${upcoming.length} นัดที่กำลังจะถึง`}
        right={<button className="icon-btn icon-btn-solid" onClick={goBook} aria-label="จองคิวใหม่"><Plus size={19} /></button>}
      />

      {/* Segmented tabs */}
      <div className="px-5 pt-2 pb-[18px]">
        <div className="segment">
          <button className={`segment-item ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>กำลังจะถึง</button>
          <button className={`segment-item ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>ประวัติ</button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {list.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl py-12 text-center" style={{ background: '#eef5fd' }}>
            <span className="tile h-12 w-12"><CalendarCheck size={22} /></span>
            <p className="text-[14px] muted">{tab === 'upcoming' ? 'ยังไม่มีนัดหมายที่กำลังจะถึง' : 'ยังไม่มีประวัติการจอง'}</p>
            {tab === 'upcoming' && <button className="btn btn-primary btn-sm px-5" onClick={goBook}>จองคิวเลย</button>}
          </div>
        )}

        {list.map((b) => (
          <Link key={b.id} to={`/my-bookings/${b.id}`} className="card flex items-center gap-4 p-[18px]">
            <div className="w-12 shrink-0 text-center">
              <p className="text-[11px] muted">{weekdayTH(b.bookingDate)}</p>
              <p className="num mt-0.5 text-[26px] leading-none" style={{ color: 'var(--heading)' }}>{dayNum(b.bookingDate)}</p>
              <p className="mt-1 text-[11px] muted">{monthTH(b.bookingDate)}</p>
            </div>
            <div className="w-px self-stretch" style={{ background: 'var(--line)' }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="num text-[17px]" style={{ color: 'var(--heading)' }}>{b.startTime}</p>
                <StatusTag status={b.status} />
              </div>
              <p className="mt-1.5 truncate text-[14px] muted">{b.items.map((i) => i.name).join(' · ')}</p>
              <p className="mt-1 text-[12px] muted">{b.staffName} · {baht(b.totalPrice)}</p>
            </div>
            <ChevronRight size={18} style={{ color: '#8790a0' }} className="shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
