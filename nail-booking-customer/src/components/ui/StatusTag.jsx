import { Check, CircleCheck, Clock, X } from 'lucide-react'
import { STATUS_META } from '../../lib/status.js'

const ICONS = { clock: Clock, 'circle-check': CircleCheck, check: Check, x: X }

export default function StatusTag({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  const Icon = ICONS[meta.icon] || Clock
  return (
    <span className={`chip ${meta.chip}`}>
      <Icon size={13} />
      {meta.label}
    </span>
  )
}
