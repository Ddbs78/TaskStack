import { nowFraction, fmtTime } from '../state/time'

// A thin vertical line that travels horizontally across the day column in sync
// with the clock (left edge = 12am, right edge = next 12am), so you can see how
// much of the day is left. A live time pill rides on top; a soft halo shows only
// on hover. Position updates with `now` (every ~30s) and glides via CSS transition.
export default function NowLine({ now = new Date() }) {
  const frac = nowFraction(now)
  const label = fmtTime(now.getHours() * 60 + now.getMinutes())
  return (
    <div
      className="nowline-travel"
      style={{ left: `${frac * 100}%`, transition: 'left 30s linear' }}
    >
      <div className="nowline-pill">{label}</div>
      <div className="nowline-hit" />
      <div className="nowline-bar" />
    </div>
  )
}
