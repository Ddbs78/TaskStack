import BrandMark from '../BrandMark'

// Artwork for the intro cards. Everything here is inline stroke/flat-fill SVG —
// no emoji, no raster, nothing that needs the network.
//
// The Memphis piece is the hybrid the user asked for: the refined drawing (b)
// with two anatomy fixes carried out — the hair is a solid cap plus a real tied
// ponytail (the old fringe path was an arc-over-an-arc, i.e. a crescent moon),
// and each leg-and-shoe is ONE continuous silhouette so the feet can no longer
// read as detached blocks.

const INK = '#2E2530'

function Figure({ x, flip, skin, hair, top, shade, ponytail, tie }) {
  const s = flip ? -1 : 1
  const P = (px, py) => `${x + s * px} ${py}`
  return (
    <g>
      {/* neck, drawn first so the torso overlaps its base */}
      <path d={`M${P(-5, 94)} h${s * 10} v14 h${s * -10} z`} fill={skin} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />

      {/* back leg + shoe as one silhouette */}
      <path
        d={`M${P(-11, 144)} L${P(-2, 144)} L${P(-2, 167)} L${P(7, 167)} a5 5 0 0 ${flip ? 0 : 1} 0 10 L${P(-8, 177)} a3 3 0 0 ${flip ? 0 : 1} ${s * -3} -3 Z`}
        fill={shade}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* front leg + shoe */}
      <path
        d={`M${P(1, 144)} L${P(11, 144)} L${P(11, 167)} L${P(20, 167)} a5 5 0 0 ${flip ? 0 : 1} 0 10 L${P(4, 177)} a3 3 0 0 ${flip ? 0 : 1} ${s * -3} -3 Z`}
        fill={top}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* shoes: separate fill, but drawn on the SAME ankle edge as the leg above,
          so they stay visually welded instead of floating like the old blocks */}
      <path
        d={`M${P(-11, 167)} L${P(7, 167)} a5 5 0 0 ${flip ? 0 : 1} 0 10 L${P(-8, 177)} a3 3 0 0 ${flip ? 0 : 1} ${s * -3} -3 Z`}
        fill={INK}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d={`M${P(1, 167)} L${P(20, 167)} a5 5 0 0 ${flip ? 0 : 1} 0 10 L${P(4, 177)} a3 3 0 0 ${flip ? 0 : 1} ${s * -3} -3 Z`}
        fill="#4A3F48"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* torso — shoulders wider than hips, hem overlapping the leg tops */}
      <path
        d={`M${P(-15, 106)} Q${P(0, 100)} ${P(15, 106)} L${P(13, 149)} Q${P(0, 154)} ${P(-13, 149)} Z`}
        fill={top}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* arm: shoulder → elbow → hand resting on the plank */}
      <path d={`M${P(13, 112)} L${P(33, 118)} L${P(56, 126)}`} fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${P(13, 112)} L${P(33, 118)} L${P(56, 126)}`} fill="none" stroke={shade} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x + s * 59} cy="127" r="5.2" fill={skin} stroke={INK} strokeWidth="1.8" />

      {/* ponytail sits BEHIND the head */}
      {ponytail && (
        <path
          d={`M${P(-11, 76)} C${P(-25, 76)} ${P(-30, 88)} ${P(-26, 99)} C${P(-24, 105)} ${P(-18, 105)} ${P(-16, 99)} C${P(-13, 92)} ${P(-11, 84)} ${P(-11, 76)} Z`}
          fill={hair}
          stroke={INK}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )}

      <circle cx={x} cy="86" r="14" fill={skin} stroke={INK} strokeWidth="1.8" />
      {/* ear */}
      <circle cx={x + s * 13} cy="89" r="2.6" fill={skin} stroke={INK} strokeWidth="1.6" />

      {/* solid hair cap — thick and blunt-ended, the opposite of a crescent */}
      <path
        d={`M${P(-14, 92)} C${P(-15, 74)} ${P(-8, 67)} ${P(0, 67)} C${P(8, 67)} ${P(15, 74)} ${P(14, 92)} C${P(12, 87)} ${P(9, 83)} ${P(4, 82)} C${P(0, 81.5)} ${P(-6, 82)} ${P(-10, 85)} C${P(-12, 87)} ${P(-13, 89)} ${P(-14, 92)} Z`}
        fill={hair}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* the tie, so the bundle reads as a ponytail and not a shadow */}
      {ponytail && (
        <rect x={flip ? x + 8 : x - 16} y="74" width="8" height="6" rx="3" fill={tie} stroke={INK} strokeWidth="1.6" />
      )}

      <circle cx={x - 5} cy="88" r="1.9" fill={INK} />
      <circle cx={x + 5} cy="88" r="1.9" fill={INK} />
      <path d={`M${x - 4} 94 c2.5 2.4 5.5 2.4 8 0`} fill="none" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />
    </g>
  )
}

// Two panels, two faces of the app, one shared thing being held up: time.
export function MemphisBridge({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 360 200"
      className={className}
      style={{ display: 'block', width: '100%', height: 'auto', ...style }}
      role="img"
      aria-label="Two people either side of a bridge, holding up a clock — the app's calm face and its hand-made face"
    >
      <rect x="10" y="20" width="150" height="160" rx="16" fill="#E6EBF3" />
      <rect x="200" y="20" width="150" height="160" rx="16" fill="#FBE3D2" />

      {/* what lives inside each panel */}
      <rect x="26" y="38" width="80" height="8" rx="4" fill="#B9C6DA" />
      <rect x="26" y="52" width="54" height="8" rx="4" fill="#CBD5E5" />
      <rect x="230" y="38" width="80" height="9" rx="4.5" fill="#F0A888" stroke={INK} strokeWidth="1.8" />
      <rect x="230" y="52" width="54" height="9" rx="4.5" fill="#F5C542" stroke={INK} strokeWidth="1.8" />

      <circle cx="180" cy="70" r="17" fill="#F5C542" stroke={INK} strokeWidth="2" />
      <path d="M180 59v11l7 5" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M180 94v14" stroke={INK} strokeWidth="1.8" strokeDasharray="3 4" />

      <rect x="136" y="122" width="88" height="11" rx="5.5" fill="#F5C542" stroke={INK} strokeWidth="1.8" />

      <Figure x={76} flip={false} skin="#F0C9A8" hair="#6B4A3A" top="#4b89f7" shade="#2F6FE0" />
      <Figure x={284} flip skin="#C98B62" hair="#33232B" top="#e58a67" shade="#cf6a44" ponytail tie="#F5C542" />
    </svg>
  )
}

// --- small schematics, shown when a spotlight step falls back to a card ------

const box = { display: 'block', width: '100%', height: 'auto' }

export function PileArt() {
  return (
    <svg viewBox="0 0 300 96" style={box} role="img" aria-label="Three overdue bars with the rest folded into a counter">
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="10" y={8 + i * 22} width="180" height="16" rx="6" fill="var(--task-coral-tint-bg)" stroke="var(--task-coral-tint-border)" strokeWidth="1.2" />
          <rect x="18" y={13 + i * 22} width={70 - i * 12} height="6" rx="3" fill="var(--task-coral-tint-text)" opacity="0.65" />
        </g>
      ))}
      <path d="M198 20h84M198 42h84M198 64h84" stroke="var(--hairline)" strokeWidth="1.4" strokeDasharray="4 5" strokeLinecap="round" />
      <rect x="206" y="8" width="72" height="52" rx="8" fill="var(--surface-2)" stroke="var(--hairline)" strokeWidth="1.4" />
      <rect x="212" y="14" width="72" height="52" rx="8" fill="var(--surface)" stroke="var(--hairline)" strokeWidth="1.4" />
      <text x="248" y="46" textAnchor="middle" style={{ font: '700 13px var(--font-sans)', fill: 'var(--text-soft)' }}>+4</text>
      <text x="150" y="90" textAnchor="middle" style={{ font: '600 11px var(--font-sans)', fill: 'var(--text-faint)' }}>
        three shown · the rest wait behind a counter
      </text>
    </svg>
  )
}

export function NowLineArt() {
  return (
    <svg viewBox="0 0 300 96" style={box} role="img" aria-label="A red line crossing a day, with an all-day band above timed tasks">
      <rect x="8" y="8" width="284" height="76" rx="8" fill="var(--surface-2)" />
      <rect x="16" y="16" width="268" height="15" rx="5" fill="var(--task-blue-tint-bg)" stroke="var(--task-blue-tint-border)" strokeWidth="1.2" />
      <text x="24" y="27" style={{ font: '700 9px var(--font-sans)', fill: 'var(--task-blue-tint-text)' }}>ALL DAY</text>
      <rect x="60" y="38" width="96" height="15" rx="5" fill="var(--task-blue-tint-bg)" stroke="var(--task-blue-tint-border)" strokeWidth="1.2" />
      <rect x="150" y="59" width="110" height="15" rx="5" fill="var(--task-blue-tint-bg)" stroke="var(--task-blue-tint-border)" strokeWidth="1.2" />
      <path d="M124 8v76" stroke="var(--now-line)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="124" cy="8" r="3.4" fill="var(--now-line)" />
      <path d="M132 14h24" stroke="var(--now-line)" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.7" />
      <text x="150" y="92" textAnchor="middle" style={{ font: '600 11px var(--font-sans)', fill: 'var(--text-faint)' }}>
        it moves while you watch
      </text>
    </svg>
  )
}

export function CaptureArt() {
  return (
    <svg viewBox="0 0 300 96" style={box} role="img" aria-label="Typing a sentence into the bar and pressing enter">
      <rect x="14" y="24" width="272" height="34" rx="17" fill="var(--surface)" stroke="var(--hairline)" strokeWidth="1.4" />
      <text x="34" y="46" style={{ font: '500 13px var(--font-sans)', fill: 'var(--text)' }}>Dentist Friday at 3</text>
      <rect x="248" y="32" width="18" height="18" rx="9" fill="var(--blue-strong)" />
      <path d="M253 41l3 3 5.5-6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="196" y="66" width="90" height="18" rx="6" fill="var(--task-blue-tint-bg)" stroke="var(--task-blue-tint-border)" strokeWidth="1.2" />
      <text x="204" y="79" style={{ font: '600 10px var(--font-sans)', fill: 'var(--task-blue-tint-text)' }}>Fri · 3:00 PM</text>
      <path d="M150 60c0 10 20 12 42 14" stroke="var(--hairline)" strokeWidth="1.4" fill="none" strokeDasharray="4 4" />
    </svg>
  )
}

export function ViewsArt() {
  return (
    <svg viewBox="0 0 300 96" style={box} role="img" aria-label="Daily, weekly and monthly views drilling into each other">
      {[
        { x: 12, label: 'Daily', cols: 3 },
        { x: 108, label: 'Weekly', cols: 7 },
        { x: 204, label: 'Monthly', cols: 7 },
      ].map((v, i) => (
        <g key={v.label}>
          <rect x={v.x} y="10" width="84" height="56" rx="8" fill="var(--surface-2)" stroke="var(--hairline)" strokeWidth="1.3" />
          {Array.from({ length: v.cols }, (_, c) => (
            <rect
              key={c}
              x={v.x + 6 + c * ((72) / v.cols)}
              y="18"
              width={(72 / v.cols) - 3}
              height={i === 2 ? 12 : 40}
              rx="3"
              fill={c === 1 ? 'var(--task-blue-tint-bg)' : 'var(--surface)'}
              stroke="var(--hairline)"
              strokeWidth="1"
            />
          ))}
          <text x={v.x + 42} y="80" textAnchor="middle" style={{ font: '700 10px var(--font-sans)', fill: 'var(--text-soft)' }}>
            {v.label}
          </text>
        </g>
      ))}
      <path d="M98 38h8M194 38h8" stroke="var(--text-faint)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// --- the two mode preview tiles on the last card ----------------------------

// A faithful mini of each mode — ported directly from the approved "make it
// yours" mockup. Professional: clean window, blue bar + coral OUTLINE bar, two
// little rotated paper notes ("4 more"), a red now-line. Personalized: paper
// grain, ink-outlined bars with hard offset shadows, the teal antenna creature
// holding the overflow ("4 lurking"). The header cube is the real BrandMark so
// the logo stays identical everywhere.
export function ModePreview({ variant }) {
  const pro = variant === 'professional'
  const ink = '#1b1b22'
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block', position: 'relative', height: 124, borderRadius: 10, overflow: 'hidden',
        background: pro ? 'var(--bg)' : '#fdf7ee',
        backgroundImage: pro ? 'none' : 'radial-gradient(rgba(27,27,34,.05) 1px, transparent 1px)',
        backgroundSize: pro ? undefined : '4px 4px',
      }}
    >
      {/* header */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 9px' }}>
        <BrandMark variant="mark" height={13} fit />
        <span style={{ font: `800 ${pro ? 9 : 9.5}px var(--font-sans)`, letterSpacing: '-.01em', color: pro ? 'var(--text)' : ink }}>TaskStack</span>
      </span>

      {/* body fills the full width; bars are wide and a third row keeps the
          window looking real at the tile's wider aspect (no stretched pixels) */}
      <span style={{ position: 'relative', display: 'block', height: 84, margin: '0 9px', borderTop: pro ? '1px solid var(--hairline)' : 'none' }}>
        {pro ? (
          <>
            <span style={{ position: 'absolute', left: 0, top: 8, width: '82%', height: 13, borderRadius: 5, background: 'var(--blue)' }} />
            <span style={{ position: 'absolute', left: 0, top: 26, width: '64%', height: 13, borderRadius: 5, background: 'var(--task-coral-tint-bg)', border: '1px solid var(--task-coral-tint-border)' }} />
            <span style={{ position: 'absolute', left: 0, top: 44, width: '46%', height: 13, borderRadius: 5, background: 'color-mix(in srgb, var(--blue) 22%, transparent)' }} />
            {/* two rotated paper notes */}
            <span style={{ position: 'absolute', left: 6, top: 64, width: 30, height: 12, borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--hairline)', transform: 'rotate(-3deg)' }} />
            <span style={{ position: 'absolute', left: 13, top: 63, width: 30, height: 12, borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--hairline)', transform: 'rotate(2deg)' }} />
            <span style={{ position: 'absolute', left: 50, top: 66, font: '700 8px var(--font-sans)', color: 'var(--text-soft)' }}>4 more</span>
            <span style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1.4, background: 'var(--now-line)' }} />
          </>
        ) : (
          <>
            <span style={{ position: 'absolute', left: 0, top: 8, width: '82%', height: 14, borderRadius: 6, background: '#4b89f7', border: `1.6px solid ${ink}`, boxShadow: '1.6px 2px 0 rgba(27,27,34,.35)' }} />
            <span style={{ position: 'absolute', left: 0, top: 28, width: '64%', height: 14, borderRadius: 6, background: '#e58a67', border: `1.6px solid ${ink}`, boxShadow: '1.6px 2px 0 rgba(27,27,34,.35)' }} />
            <span style={{ position: 'absolute', left: 0, top: 48, width: '46%', height: 14, borderRadius: 6, background: '#F5C542', border: `1.6px solid ${ink}`, boxShadow: '1.6px 2px 0 rgba(27,27,34,.35)' }} />
            {/* the antenna creature holding the overflow */}
            <svg width="32" height="28" viewBox="0 0 44 38" style={{ position: 'absolute', left: 2, top: 56 }}>
              <ellipse cx="21" cy="24" rx="16" ry="12" fill="#7FD1C1" stroke={ink} strokeWidth="2.4" />
              <circle cx="15" cy="22" r="2" fill={ink} /><circle cx="27" cy="22" r="2" fill={ink} />
              <path d="M16 29c3 2.6 9 2.6 12 0" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
              <path d="M9 15c1-5 5-8 9-8" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="19" cy="6" r="3.4" fill="#F5C542" stroke={ink} strokeWidth="2.2" />
            </svg>
            <span style={{ position: 'absolute', left: 40, top: 66, font: '800 8px var(--font-sans)', color: ink }}>4 lurking</span>
            <span style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1.6, background: '#ff3b30' }} />
          </>
        )}
      </span>
    </span>
  )
}
