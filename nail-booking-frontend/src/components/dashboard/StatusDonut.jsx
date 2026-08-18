import Corners from '../ui/Corners'
import { STATUS_META, STATUS_ORDER } from '../../lib/status'

// Hand-built SVG donut (stroke-dasharray segments) + legend.
export default function StatusDonut({ stats }) {
  const data = STATUS_ORDER.map((k) => ({ key: k, value: stats[k], color: STATUS_META[k].color })).filter(
    (d) => d.value > 0,
  )
  const total = data.reduce((s, d) => s + d.value, 0) || 1

  const r = 62, cx = 90, cy = 90, sw = 20
  const C = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="card blueprint" style={{ padding: 22 }}>
      <Corners />
      <h3 className="serif-display m-0 text-[19px]">สถานะการจองวันนี้</h3>
      <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>
        ทั้งหมด {stats.total} รายการ
      </p>

      <div className="my-4 flex justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-neutral-200)" strokeWidth={sw} />
          {data.map((d) => {
            const dash = (d.value / total) * C
            const seg = (
              <circle
                key={d.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={sw}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )
            offset += dash
            return seg
          })}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="600" fontFamily="var(--font-heading)" fill="var(--color-text)">
            {stats.total}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fontFamily="var(--font-body)" fill="var(--color-neutral-500)">
            นัดหมาย
          </text>
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        {STATUS_ORDER.map((k) => (
          <div key={k} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2" style={{ color: 'var(--color-neutral-700)' }}>
              <span className="h-2 w-2" style={{ background: STATUS_META[k].color }} />
              {STATUS_META[k].label}
            </span>
            <span className="font-semibold">{stats[k]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
