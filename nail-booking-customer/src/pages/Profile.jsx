import { useState } from 'react'
import { Bell, CalendarCheck, Check, ChevronRight, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader.jsx'
import { useBooking } from '../context/BookingContext.jsx'
import { monthTH, TODAY } from '../lib/status.js'

export default function Profile() {
  const nav = useNavigate()
  const { myBookings, currentUser } = useBooking()
  const [phone, setPhone] = useState(currentUser.phone)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notify, setNotify] = useState(true)

  const done = myBookings.filter((b) => b.status === 'completed')
  const stats = {
    visits: done.length,
    totalSpend: done.reduce((s, b) => s + b.totalPrice, 0),
    upcoming: myBookings.filter((b) => ['confirmed', 'pending'].includes(b.status) && b.bookingDate >= TODAY).length,
  }
  const memberSince = `${monthTH(currentUser.memberSince)} ${(Number(currentUser.memberSince.split('-')[0]) + 543) % 100}`

  const save = () => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 1800) }

  const Stat = ({ value, label }) => (
    <div className="card px-3.5 py-4">
      <p className="text-[12px] muted">{label}</p>
      <p className="num mt-2 text-[26px] leading-none" style={{ color: 'var(--heading)' }}>{value}</p>
    </div>
  )

  return (
    <div className="flex min-h-[100dvh] flex-col pb-6">
      <AppHeader title="โปรไฟล์" />

      {/* Identity */}
      <div className="px-5 pt-2">
        <div className="card flex items-center gap-4 p-[22px]">
          <span className="num flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full text-[22px]" style={{ background: 'var(--rose-soft)', color: 'var(--rose)' }}>
            {currentUser.displayName?.[0] || 'P'}
          </span>
          <div className="min-w-0">
            <p className="display text-[18px]">{currentUser.fullName}</p>
            <p className="mt-1 text-[13px] muted">เชื่อมบัญชีผ่าน LINE · สมาชิกตั้งแต่ {memberSince}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 px-5 pt-3">
        <Stat value={stats.visits} label="ครั้งที่มา" />
        <Stat value={stats.totalSpend.toLocaleString('en-US')} label="ยอดสะสม" />
        <Stat value={stats.upcoming} label="นัดที่จะถึง" />
      </div>

      {/* Settings list */}
      <div className="px-5 pt-5">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3.5 px-5 py-[18px]">
            <span style={{ color: 'var(--rose-icon)' }}><Phone size={17} /></span>
            {editing ? (
              <input className="field flex-1" style={{ padding: '8px 12px' }} value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
            ) : (
              <span className="flex-1 text-[14px]" style={{ color: 'var(--body)' }}>{phone}</span>
            )}
            {editing ? (
              <button className="text-[13px]" style={{ color: 'var(--rose)' }} onClick={save}>บันทึก</button>
            ) : (
              <button className="text-[13px]" style={{ color: 'var(--rose)' }} onClick={() => setEditing(true)}>แก้ไข</button>
            )}
          </div>
          <div className="mx-5 divider" />
          <div className="flex items-center gap-3.5 px-5 py-[18px]">
            <span style={{ color: 'var(--rose-icon)' }}><Bell size={17} /></span>
            <span className="flex-1 text-[14px]" style={{ color: 'var(--body)' }}>แจ้งเตือนก่อนถึงนัด</span>
            <button
              className="switch"
              onClick={() => setNotify((v) => !v)}
              style={{ background: notify ? 'var(--rose)' : '#d4dde8', justifyContent: notify ? 'flex-end' : 'flex-start' }}
              aria-label="สลับการแจ้งเตือน"
            >
              <span style={{ margin: notify ? '0 0 0 auto' : '0' }} />
            </button>
          </div>
          <div className="mx-5 divider" />
          <button className="flex w-full items-center gap-3.5 px-5 py-[18px] text-left" onClick={() => nav('/my-bookings')}>
            <span style={{ color: 'var(--rose-icon)' }}><CalendarCheck size={17} /></span>
            <span className="flex-1 text-[14px]" style={{ color: 'var(--body)' }}>ประวัติการจอง</span>
            <ChevronRight size={17} style={{ color: '#8790a0' }} />
          </button>
        </div>
        {saved && (
          <p className="mt-2.5 inline-flex items-center gap-1 text-[13px]" style={{ color: '#3f7a5c' }}>
            <Check size={14} /> บันทึกเบอร์โทรแล้ว
          </p>
        )}
      </div>

      {/* Logout */}
      <div className="px-5 pt-5">
        <button className="btn btn-secondary btn-block">ออกจากระบบ LINE</button>
      </div>
    </div>
  )
}
