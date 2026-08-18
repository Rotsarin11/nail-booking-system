import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, PanelLeftClose, PanelLeftOpen, CalendarPlus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { baht, dateTH } from '../../lib/status'

// "เมื่อสักครู่" / "N นาทีที่แล้ว" / "N ชม.ที่แล้ว"
function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return 'เมื่อสักครู่'
  if (m < 60) return `${m} นาทีที่แล้ว`
  return `${Math.floor(m / 60)} ชม.ที่แล้ว`
}

export default function Topbar({ title = 'แดชบอร์ด', collapsed = false, onToggleSidebar }) {
  const { notifications, unread, markNotificationsRead } = useData()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  // Jump straight to the booking so the admin can confirm without extra clicks.
  const openBooking = (id) => {
    setOpen(false)
    markNotificationsRead()
    nav('/bookings', { state: { filter: 'pending', openId: id } })
  }

  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // close the panel when clicking outside
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const toggle = () => {
    setOpen((v) => {
      const next = !v
      if (next) markNotificationsRead()
      return next
    })
  }

  return (
    <header
      className="flex items-center gap-4 bg-white px-4 py-[18px] lg:px-8"
      style={{ borderBottom: '1px solid var(--color-divider)' }}
    >
      <button
        onClick={onToggleSidebar}
        className="btn btn-icon btn-secondary btn-pill"
        aria-label={collapsed ? 'ขยายเมนู' : 'ยุบเมนู'}
        title={collapsed ? 'ขยายเมนู' : 'ยุบเมนู'}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <div>
        <h1 className="serif-display m-0 text-[24px]" style={{ color: 'var(--color-accent-900)' }}>{title}</h1>
        <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>{today}</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-neutral-500)' }} />
          <input className="search-input" type="text" placeholder="ค้นหาการจอง / ลูกค้า" />
        </div>

        <div className="relative" ref={ref}>
          <button className="btn btn-icon btn-pill btn-secondary relative" aria-label="แจ้งเตือน" onClick={toggle}>
            <Bell size={17} strokeWidth={1.5} />
            {unread > 0 && (
              <span
                className="absolute -right-[3px] -top-[3px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-[4px] text-[10px] font-semibold text-white"
                style={{ background: 'var(--color-accent-700)' }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-[46px] z-50 w-[320px] overflow-hidden rounded-[14px] bg-white"
              style={{ border: '1px solid var(--color-divider)', boxShadow: 'var(--shadow-lg)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-divider)' }}>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--color-neutral-900)' }}>การจองใหม่</span>
                <span className="text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>{notifications.length} รายการ</span>
              </div>
              <div className="max-h-[360px] overflow-y-auto scroll-thin">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--color-neutral-500)' }}>ยังไม่มีการจองใหม่</p>
                ) : (
                  notifications.map((n) => (
                    <button key={n.id + n.at} type="button" onClick={() => openBooking(n.id)}
                      className="apt-row flex w-full gap-3 px-4 py-3 text-left" style={{ borderBottom: '1px solid var(--color-divider)', cursor: 'pointer' }}>
                      <span className="stat-icon" style={{ width: 34, height: 34, borderRadius: 10 }}><CalendarPlus size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-[13px]" style={{ color: 'var(--color-neutral-900)' }}>
                          <span className="font-semibold">{n.userName}</span> จองคิวใหม่
                        </p>
                        <p className="m-0 mt-[2px] truncate text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>
                          {n.services} · {dateTH(n.bookingDate)} {n.startTime} · {baht(n.totalPrice)}
                        </p>
                        <p className="m-0 mt-[3px] text-[11px]" style={{ color: 'var(--color-neutral-500)' }}>แตะเพื่อยืนยัน · {ago(n.at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
