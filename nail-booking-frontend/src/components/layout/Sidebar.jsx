import { NavLink } from 'react-router-dom'
import {
  Sparkles, LayoutDashboard, CalendarDays, Scissors, Users, CalendarOff, Bell, Settings,
} from 'lucide-react'
import Corners from '../ui/Corners'

const nav = [
  { to: '/', label: 'แดชบอร์ด', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'การจอง', icon: CalendarDays },
  { to: '/staff', label: 'ช่าง', icon: Scissors },
  { to: '/services', label: 'บริการ', icon: Sparkles },
  { to: '/customers', label: 'ลูกค้า', icon: Users },
  { to: '/closures', label: 'วันหยุด/วันลา', icon: CalendarOff },
  { to: '/notifications', label: 'การแจ้งเตือน', icon: Bell },
  { to: '/settings', label: 'ตั้งค่า', icon: Settings },
]

// Persistent sidebar. `collapsed` shrinks it to an icon-only rail.
export default function Sidebar({ collapsed = false }) {
  return (
    <aside
      className="flex h-full flex-none flex-col bg-white"
      style={{
        width: collapsed ? 72 : 248,
        borderRight: '1px solid var(--color-divider)',
        transition: 'width 0.2s ease',
      }}
    >
      {/* brand */}
      <div
        className="flex flex-none items-center gap-3 py-[22px]"
        style={{
          borderBottom: '1px solid var(--color-divider)',
          paddingLeft: collapsed ? 0 : 18,
          paddingRight: collapsed ? 0 : 18,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          className="blueprint flex h-[38px] w-[38px] flex-none items-center justify-center text-white"
          style={{ background: 'var(--color-accent)' }}
        >
          <Corners />
          <Sparkles size={18} strokeWidth={1.5} />
        </div>
        {!collapsed && (
          <div>
            <p className="serif-display m-0 text-[17px]" style={{ color: 'var(--color-accent-800)' }}>Take Care</p>
            <p className="m-0 text-[11px]" style={{ color: 'var(--color-neutral-600)' }}>ระบบจัดการร้าน</p>
          </div>
        )}
      </div>

      <nav className="scroll-thin flex flex-1 flex-col gap-[2px] overflow-y-auto py-[14px]">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
            style={collapsed ? { justifyContent: 'center', gap: 0, padding: '11px 0' } : undefined}
          >
            <Icon size={17} strokeWidth={1.5} style={{ flex: 'none' }} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div
        className="flex flex-none items-center gap-[10px] py-[16px]"
        style={{
          borderTop: '1px solid var(--color-divider)',
          paddingLeft: collapsed ? 0 : 18,
          paddingRight: collapsed ? 0 : 18,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          className="blueprint flex h-8 w-8 flex-none items-center justify-center font-heading text-[13px] font-semibold"
          style={{ color: 'var(--color-accent-800)' }}
          title={collapsed ? 'แอดมินร้าน' : undefined}
        >
          <Corners />A
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="m-0 whitespace-nowrap text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>แอดมินร้าน</p>
            <p className="m-0 text-[11px]" style={{ color: 'var(--color-neutral-600)' }}>admin@takecarenail</p>
          </div>
        )}
      </div>
    </aside>
  )
}
