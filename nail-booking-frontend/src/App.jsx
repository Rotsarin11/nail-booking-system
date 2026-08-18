import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import Bookings from './pages/Bookings'
import Staff from './pages/Staff'
import Services from './pages/Services'
import Customers from './pages/Customers'
import Closures from './pages/Closures'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Placeholder from './pages/Placeholder'

const TITLES = {
  '/': 'แดชบอร์ด',
  '/bookings': 'การจอง',
  '/staff': 'ช่าง',
  '/services': 'บริการ',
  '/customers': 'ลูกค้า',
  '/closures': 'วันหยุด/วันลา',
  '/notifications': 'การแจ้งเตือน',
  '/settings': 'ตั้งค่า',
}

export default function App() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'แดชบอร์ด'
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Persistent sidebar — collapsible via the topbar toggle */}
      <Sidebar collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title={title} collapsed={collapsed} onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main className="scroll-thin flex-1 overflow-y-auto p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/services" element={<Services />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/closures" element={<Closures />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Placeholder title="ไม่พบหน้านี้ (404)" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
