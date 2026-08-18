// Thin 4-segment progress bar for the booking flow (1-based current step).
export default function StepBar({ current, total = 4 }) {
  return (
    <div className="progress px-5 pt-4" style={{ '--steps': total }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < current ? 'done' : ''} />
      ))}
    </div>
  )
}
