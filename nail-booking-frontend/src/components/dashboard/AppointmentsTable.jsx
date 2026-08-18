import { useNavigate } from 'react-router-dom'
import Corners from '../ui/Corners'
import { STATUS_META, baht } from '../../lib/status'

export default function AppointmentsTable({ rows }) {
  const navigate = useNavigate()
  return (
    <div className="card blueprint" style={{ padding: 0, overflow: 'hidden' }}>
      <Corners />
      <div className="flex items-center justify-between px-[22px] pb-[14px] pt-[18px]">
        <div>
          <h3 className="serif-display m-0 text-[19px]">นัดหมายวันนี้</h3>
          <p className="m-0 mt-[2px] text-[12px]" style={{ color: 'var(--color-neutral-500)' }}>
            {rows.length} รายการ · เรียงตามเวลา
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary btn-pill">+ นัดหมายใหม่</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/bookings')}>
            ดูทั้งหมด
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scroll-thin">
        <table className="table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>เวลา</th>
              <th>ลูกค้า</th>
              <th>บริการ</th>
              <th>ช่าง</th>
              <th>ยอด</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const meta = STATUS_META[b.status]
              return (
                <tr key={b.id} className="apt-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/bookings', { state: { filter: 'today' } })}>
                  <td className="whitespace-nowrap font-semibold">
                    {b.startTime} <span style={{ color: 'var(--color-neutral-400)' }}>– {b.endTime}</span>
                  </td>
                  <td className="whitespace-nowrap">{b.userName}</td>
                  <td style={{ color: 'var(--color-neutral-600)' }}>{b.items.map((it) => it.name).join(', ')}</td>
                  <td className="whitespace-nowrap" style={{ color: 'var(--color-neutral-600)' }}>{b.staffName}</td>
                  <td className="whitespace-nowrap font-semibold">{baht(b.totalPrice)}</td>
                  <td>
                    <span className={`tag ${meta.tag}`}>{meta.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
