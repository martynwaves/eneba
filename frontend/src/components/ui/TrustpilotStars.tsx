import clsx from 'clsx'
import { StarIcon } from './Stars'

/** Eneba's TrustScore on Trustpilot. */
export const TRUSTPILOT_SCORE = 4.4

const SIZES = {
  md: { gap: 'gap-[2px]', box: 'size-[22px]', star: 'size-4' },
  lg: { gap: 'gap-[3px]', box: 'size-6', star: 'size-4' },
  xl: { gap: 'gap-[3px]', box: 'size-[26px] sm:size-[33px]', star: 'size-6' },
}

/** Trustpilot's green star boxes, the last one filled to the decimal of the score. */
export function TrustpilotStars({ size = 'md' }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size]
  return (
    <span role="img" className={clsx('flex', s.gap)} aria-label={`Rated ${TRUSTPILOT_SCORE} out of 5 on Trustpilot`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={clsx('relative grid place-items-center bg-[#dcdce6]', s.box)}>
          <span className="absolute inset-y-0 left-0 bg-[#00b67a]" style={{ width: `${Math.max(0, Math.min(1, TRUSTPILOT_SCORE - i)) * 100}%` }} />
          <StarIcon className={clsx('relative text-white', s.star)} />
        </span>
      ))}
    </span>
  )
}
