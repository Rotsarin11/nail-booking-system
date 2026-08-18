import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Header for the new minimal design.
// - `back` renders a 44px circular back button (arrow-left)
// - `title` uses the Manrope display face
// - `subtitle` sits under the title (page headers)
// - `right` slots an action / step counter on the far right
export default function AppHeader({ title, subtitle, back = false, right = null }) {
  const nav = useNavigate()
  return (
    <header className="flex items-start gap-3 px-5 pt-6 pb-2">
      {back && (
        <button className="icon-btn" style={{ color: 'var(--muted)' }} onClick={() => nav(-1)} aria-label="ย้อนกลับ">
          <ArrowLeft size={18} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="display truncate" style={{ fontSize: back ? 18 : 24, lineHeight: 1.2, paddingTop: back ? 10 : 0 }}>
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-[13px] muted">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0" style={{ paddingTop: back ? 10 : 2 }}>{right}</div>}
    </header>
  )
}
