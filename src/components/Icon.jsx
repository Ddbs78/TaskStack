// Minimal, stroke-based icon set (Apple-/Lucide-esque). Monochrome — inherits
// currentColor. Replaces the emoji used across the app for a cleaner feel.
const P = {
  sparkles: <path d="M12 4l1.7 4.9L18.5 11l-4.8 1.7L12 18l-1.7-5.3L5.5 11l4.8-1.7z" />,
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 1.8" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 1 1 10.5 4 6.2 6.2 0 0 0 20 13.5z" />,
  repeat: (
    <>
      <path d="M16 3l3 3-3 3" />
      <path d="M5 11V9a3 3 0 0 1 3-3h11" />
      <path d="M8 21l-3-3 3-3" />
      <path d="M19 13v2a3 3 0 0 1-3 3H5" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  arrowUp: <path d="M12 19V6M6 12l6-6 6 6" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M18.9 5.1l-2.1 2.1M7.2 16.8l-2.1 2.1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </>
  ),
  trash: <path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0v12a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19V7" />,
  help: (<><circle cx="12" cy="12" r="9" /><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4" /><path d="M12 17.4h.01" /></>),
  bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6z" />,
}

export default function Icon({ name, size = 20, stroke = 1.75, className = '', style }) {
  const glyph = P[name]
  if (!glyph) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {glyph}
    </svg>
  )
}
