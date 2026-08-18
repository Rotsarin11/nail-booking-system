import { CalendarCheck, House, Sparkles, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'หน้าแรก', icon: House, end: true },
  { to: '/services', label: 'บริการ', icon: Sparkles },
  { to: '/my-bookings', label: 'นัดของฉัน', icon: CalendarCheck },
  { to: '/profile', label: 'โปรไฟล์', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icon size={21} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
