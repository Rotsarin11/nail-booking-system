import Corners from '../ui/Corners'

export default function PopularServices({ items }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="card blueprint" style={{ padding: 22 }}>
      <Corners />
      <h3 className="serif-display m-0 text-[19px]">บริการยอดนิยม</h3>
      <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>
        จัดอันดับตามจำนวนการจอง
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {items.map((it, i) => (
          <div key={it.name}>
            <div className="mb-[6px] flex items-center justify-between text-[13px]">
              <span style={{ color: 'var(--color-neutral-700)' }}>
                <span className="mr-2 text-[11px] font-semibold" style={{ color: 'var(--color-neutral-400)' }}>
                  {i + 1}
                </span>
                {it.name}
              </span>
              <span className="font-semibold">{it.count}</span>
            </div>
            <div className="svc-bar-track">
              <div className="svc-bar-fill" style={{ width: `${(it.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
