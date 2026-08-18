import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Centered modal dialog, rendered in a portal on <body> so it always floats
// in the middle of the viewport (never trapped by a transformed/filtered
// ancestor). Closes on backdrop click, the X button, or Esc.
export default function Modal({ title, subtitle, onClose, children, footer, width = 520 }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  return createPortal(
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(24,36,66,0.35)', backdropFilter: 'blur(2px)', padding: 20,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="scroll-thin"
        style={{
          width: '100%', maxWidth: width, maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-divider)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex items-start gap-3 px-[22px] pb-[14px] pt-[18px]" style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-divider)', zIndex: 1 }}>
          <div className="mr-auto">
            <h3 className="serif-display m-0 text-[19px]">{title}</h3>
            {subtitle && <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="btn btn-icon btn-secondary btn-pill" aria-label="ปิด"><X size={17} /></button>
        </div>
        <div className="px-[22px] py-[18px]">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 px-[22px] pb-[18px] pt-[4px]" style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)' }}>{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// Shared field wrapper + input style helpers for admin forms.
export const fieldStyle = {
  border: '1px solid var(--color-divider)', background: 'var(--color-neutral-100)',
  padding: '9px 12px', font: '400 14px var(--font-body)', color: 'var(--color-text)',
  borderRadius: 'var(--radius-md)', width: '100%',
}
export function Field({ label, children, full }) {
  return (
    <label className="flex flex-col gap-[7px]" style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <span className="text-[12.5px] font-medium" style={{ color: 'var(--color-accent-800)' }}>{label}</span>
      {children}
    </label>
  )
}
