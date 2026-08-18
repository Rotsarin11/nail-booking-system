import { CalendarDays, Clock3, Wallet, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/dashboard/StatCard'
import RevenueChart from '../components/dashboard/RevenueChart'
import StatusDonut from '../components/dashboard/StatusDonut'
import AppointmentsTable from '../components/dashboard/AppointmentsTable'
import PopularServices from '../components/dashboard/PopularServices'
import { TODAY, revenueLast7Days, popularServices } from '../data/mockData'
import { useData } from '../context/DataContext'
import { baht } from '../lib/status'

export default function Dashboard() {
  const { bookings, staff, customers } = useData()
  const nav = useNavigate()
  const toBookings = (filter) => nav('/bookings', { state: { filter } })

  const todayBookings = bookings
    .filter((b) => b.bookingDate === TODAY)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const countBy = (s) => todayBookings.filter((b) => b.status === s).length
  const status = {
    total: todayBookings.length,
    pending: countBy('pending'),
    confirmed: countBy('confirmed'),
    completed: countBy('completed'),
    cancelled: countBy('cancelled'),
    no_show: countBy('no_show'),
  }
  const revenue = revenueLast7Days()
  const revenueToday = todayBookings
    .filter((b) => b.status === 'completed')
    .reduce((s, b) => s + b.totalPrice, 0)
  const activeStaff = staff.filter((s) => s.status === 'active').length

  return (
    <div className="relative flex flex-col gap-[22px]">
      {/* decorative blurred blobs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
        <span
          className="absolute -left-[60px] -top-[120px] h-[260px] w-[260px] rounded-full"
          style={{ background: 'var(--color-accent-200)', opacity: 0.55, filter: 'blur(50px)' }}
        />
        <span
          className="absolute -top-[80px] left-[340px] h-[200px] w-[200px] rounded-full"
          style={{ background: 'var(--color-accent-2-200)', opacity: 0.5, filter: 'blur(46px)' }}
        />
      </div>

      {/* stat cards */}
      <div
        className="relative z-[1] grid gap-[18px]"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        <StatCard
          icon={CalendarDays}
          label="การจองวันนี้"
          value={status.total}
          sub={`ยืนยันแล้ว ${status.confirmed} · รอยืนยัน ${status.pending}`}
          onClick={() => toBookings('today')}
        />
        <StatCard icon={Clock3} label="รอยืนยัน" value={status.pending} sub="ต้องดำเนินการ" onClick={() => toBookings('pending')} />
        <StatCard icon={Wallet} label="รายได้วันนี้" value={baht(revenueToday)} sub="จากงานที่เสร็จสิ้น" onClick={() => toBookings('completed')} />
        <StatCard
          icon={Users}
          label="ลูกค้าทั้งหมด"
          value={customers.length}
          sub={`ช่างพร้อมให้บริการ ${activeStaff} คน`}
          onClick={() => nav('/customers')}
        />
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenue} />
        </div>
        <StatusDonut stats={status} />
      </div>

      {/* table + popular services */}
      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AppointmentsTable rows={todayBookings} />
        </div>
        <PopularServices items={popularServices()} />
      </div>
    </div>
  )
}
