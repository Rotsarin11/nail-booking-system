// Glassmorphism stat card: icon chip, optional delta tag, label/value/sub.
// Pass `onClick` to make it an interactive filter card; `active` highlights it.
export default function StatCard({ icon: Icon, label, value, sub, delta, onClick, active }) {
  const clickable = typeof onClick === 'function'
  return (
    <div
      className="glass-card stat-card"
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      style={clickable ? { cursor: 'pointer', outline: active ? '2px solid var(--color-accent)' : 'none', outlineOffset: 2 } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="stat-icon">
          <Icon size={18} strokeWidth={1.5} />
        </div>
        {typeof delta === 'number' && <span className="tag tag-accent">+{delta}%</span>}
      </div>
      <div>
        <p className="m-0 text-[13px]" style={{ color: 'var(--color-neutral-600)' }}>
          {label}
        </p>
        <p className="m-0 mt-[2px] font-display text-[30px] font-semibold leading-none">{value}</p>
        <p className="m-0 mt-[6px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>
          {sub}
        </p>
      </div>
    </div>
  )
}
