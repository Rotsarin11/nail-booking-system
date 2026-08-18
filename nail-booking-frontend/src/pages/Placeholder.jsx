import { Construction } from 'lucide-react'
import Corners from '../components/ui/Corners'

// Simple stub for nav routes not built yet.
export default function Placeholder({ title }) {
  return (
    <div
      className="card blueprint flex min-h-[60vh] flex-col items-center justify-center text-center"
      style={{ background: 'transparent' }}
    >
      <Corners />
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-700)' }}
      >
        <Construction size={22} />
      </div>
      <h2 className="serif-display m-0 text-[19px]" style={{ color: 'var(--color-accent-900)' }}>
        {title}
      </h2>
      <p className="m-0 mt-1 text-[13px]" style={{ color: 'var(--color-neutral-500)' }}>
        หน้านี้ยังไม่ถูกพัฒนา — เริ่มจากแดชบอร์ดก่อน
      </p>
    </div>
  )
}
