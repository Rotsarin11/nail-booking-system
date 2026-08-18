import { Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav.jsx'
import Home from './pages/Home.jsx'
import Services from './pages/Services.jsx'
import MyBookings from './pages/MyBookings.jsx'
import BookingDetail from './pages/BookingDetail.jsx'
import Profile from './pages/Profile.jsx'
import BookServices from './pages/booking/BookServices.jsx'
import BookStaff from './pages/booking/BookStaff.jsx'
import BookDateTime from './pages/booking/BookDateTime.jsx'
import BookConfirm from './pages/booking/BookConfirm.jsx'
import BookSuccess from './pages/booking/BookSuccess.jsx'

// The booking flow + success screens hide the bottom tab bar for focus.
const HIDE_NAV = ['/book', '/booking-success']

export default function App() {
  const { pathname } = useLocation()
  const hideNav = HIDE_NAV.some((p) => pathname.startsWith(p))

  return (
    <div className="app-shell flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-bookings/:id" element={<BookingDetail />} />
          <Route path="/profile" element={<Profile />} />

          {/* Booking flow */}
          <Route path="/book" element={<BookServices />} />
          <Route path="/book/staff" element={<BookStaff />} />
          <Route path="/book/datetime" element={<BookDateTime />} />
          <Route path="/book/confirm" element={<BookConfirm />} />
          <Route path="/booking-success/:id" element={<BookSuccess />} />

          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
