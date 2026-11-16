/** EU flag; emoji flags don't render on Windows, so it's drawn inline. */
export function EuFlag({ className = 'h-3.5 w-5' }: { className?: string }) {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6
    return { x: 15 + 6 * Math.sin(a), y: 10 - 6 * Math.cos(a) }
  })
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#003399" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r="0.9" fill="#ffcc00" />
      ))}
    </svg>
  )
}
