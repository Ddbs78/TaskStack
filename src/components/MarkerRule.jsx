// A rough hand-drawn marker stroke used instead of 1px rules under section
// labels. The wobble is deterministic per `seed` so a given label always draws
// the same stroke — it should look hand-made, not restless.
const PATHS = [
  'M2 5 C 26 2, 48 7, 74 3.5 S 128 6.5, 156 3 S 188 5.5, 198 4.5',
  'M2 4 C 30 6.5, 56 2, 82 5 S 130 2.5, 158 5.5 S 186 3, 198 4',
  'M2 5.5 C 22 3, 50 6, 78 3 S 124 6, 152 3.5 S 184 6, 198 4',
]

export default function MarkerRule({ color = 'currentColor', seed = 0, opacity = 0.5 }) {
  const d = PATHS[Math.abs(seed) % PATHS.length]
  return (
    <svg className="marker-rule" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity={opacity} />
    </svg>
  )
}
