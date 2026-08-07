// Hand-drawn margin doodles. Small pieces of warmth that appear where the UI
// would otherwise be blank or purely functional — the sketchbook equivalent of
// whitespace someone actually drew in.
const INK = 'currentColor'

export function EmptyDayDoodle({ width = 120 }) {
  return (
    <svg viewBox="0 0 120 46" width={width} height={width * (46 / 120)} aria-hidden="true">
      <path d="M10 34q14-10 26 0t26 0 26 0" fill="none" stroke="#7FD8A8" strokeWidth="2.2" strokeLinecap="round" opacity=".7" />
      <circle cx="30" cy="18" r="3" fill="#F5D06B" />
      <circle cx="86" cy="14" r="2.4" fill="#F58FA8" />
      <path d="M60 8v6M57 11h6" stroke="#8FC7F5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// stamps on at an angle over a completed task
export function DoneStamp({ width = 76 }) {
  return (
    <svg viewBox="0 0 120 46" width={width} height={width * (46 / 120)} aria-hidden="true">
      <g transform="rotate(-11 60 23)">
        <rect x="26" y="9" width="68" height="27" rx="5" fill="none" stroke="var(--success)" strokeWidth="2.6" />
        <text
          x="60" y="28" textAnchor="middle"
          fontFamily="var(--font-display)" fontSize="13" fontWeight="800"
          fill="var(--success)" letterSpacing="1"
        >
          DONE
        </text>
      </g>
    </svg>
  )
}

// a rough inked arrow used to point at things in the guide
export function ScrawlArrow({ width = 72, flip = false }) {
  return (
    <svg viewBox="0 0 80 40" width={width} height={width * 0.5} aria-hidden="true" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <path d="M4 30c14-8 28-16 46-18" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 6l12 6-10 8" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
