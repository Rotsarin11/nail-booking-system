import { Check, Plus } from 'lucide-react'
import { serviceIcon } from '../../lib/icons.js'
import { baht } from '../../lib/status.js'

// Selectable service row for the booking flow (step 1).
export default function ServiceCard({ service, selected, onToggle }) {
  const Icon = serviceIcon(service.icon)
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`card ${selected ? 'card-selected' : ''} flex w-full items-center gap-3.5 p-4 text-left`}
    >
      <span className="tile h-[42px] w-[42px]" style={selected ? { background: 'var(--rose-soft)', color: 'var(--rose)' } : undefined}>
        <Icon size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px]" style={{ color: 'var(--heading)' }}>{service.name}</p>
        <p className="mt-1 text-[13px] muted">{baht(service.price)} · {service.durationMin} นาที</p>
      </div>
      <span
        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
        style={{
          background: selected ? 'var(--rose)' : 'transparent',
          border: selected ? 'none' : '1px solid #dbe6f5',
          color: selected ? '#fff' : '#a9bdd8',
        }}
      >
        {selected ? <Check size={14} /> : <Plus size={14} />}
      </span>
    </button>
  )
}
