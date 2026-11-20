import clsx from 'clsx'

/** Five yellow stars, partially filled for fractional ratings. */
export function Stars({ value, className = 'size-4', max = 5 }: { value: number; className?: string; max?: number }) {
  return (
    <span role="img" className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <span key={i} className={clsx('relative inline-block', className)}>
            <StarIcon className="absolute inset-0 text-white/20" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarIcon className={clsx('text-cta', className)} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** A five-pointed star in the current text colour (ratings, Trustpilot boxes). */
export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  )
}
