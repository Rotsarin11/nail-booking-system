import Corners from '../ui/Corners'
import { baht } from '../../lib/status'

// Hand-built SVG area chart (matches the rose-gold blueprint design).
export default function RevenueChart({ data }) {
  const total = data.reduce((s, d) => s + d.revenue, 0)

  const w = 560, h = 220, padL = 34, padR = 10, padT = 12, padB = 26
  const max = Math.max(...data.map((d) => d.revenue), 1) * 1.15
  const innerW = w - padL - padR, innerH = h - padT - padB
  const x = (i) => padL + (i / (data.length - 1)) * innerW
  const y = (v) => padT + innerH - (v / max) * innerH
  const pts = data.map((d, i) => [x(i), y(d.revenue)])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0]},${padT + innerH} L${pts[0][0]},${padT + innerH} Z`
  const grid = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="card blueprint" style={{ padding: 22 }}>
      <Corners />
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="serif-display m-0 text-[19px]">รายได้ 7 วันล่าสุด</h3>
          <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>
            รวมงานที่ให้บริการเสร็จสิ้น
          </p>
        </div>
        <p className="m-0 font-heading text-[20px] font-semibold" style={{ color: 'var(--color-accent-800)' }}>
          {baht(total)}
        </p>
      </div>

      <div style={{ height: 220 }}>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-600)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-accent-600)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {grid.map((t, i) => {
            const gy = padT + innerH * t
            return <line key={i} x1={padL} y1={gy} x2={w - padR} y2={gy} stroke="var(--color-divider)" strokeWidth="1" />
          })}
          <path d={area} fill="url(#revfill)" />
          <path d={line} fill="none" stroke="var(--color-accent-700)" strokeWidth="2" />
          {pts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--color-accent-800)" />
          ))}
          {data.map((d, i) => (
            <text
              key={i}
              x={x(i)}
              y={h - 6}
              fontSize="11"
              fill="var(--color-neutral-600)"
              textAnchor="middle"
              fontFamily="var(--font-body)"
            >
              {d.day}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
