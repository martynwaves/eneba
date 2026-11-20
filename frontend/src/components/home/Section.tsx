import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { InfoTooltip } from '../ui/Tooltip'

/**
 * Full-width homepage band. Sections alternate between the base purple and a darker band,
 * which Eneba draws as a 30% black overlay.
 */
export function Section({ tone, children, label }: { tone: 'light' | 'dark'; children: ReactNode; label?: string | null }) {
  return (
    <section aria-label={label ?? undefined} className={clsx('py-10 md:py-[50px]', tone === 'dark' && 'bg-black/30')}>
      <div className="page-container">{children}</div>
    </section>
  )
}

export function SectionTitle({ title, tooltip }: { title: string | null; tooltip?: string | null }) {
  return (
    <h2 className="mb-6 flex items-center gap-2.5 text-[24px] leading-tight font-bold md:mb-[30px] md:text-[30px] md:leading-[37.5px]">
      {title}
      {tooltip && <InfoTooltip text={tooltip} />}
    </h2>
  )
}

/** Eneba's centred outline button under a section ("Show all", "See all", "Load more"). */
export function SectionButton({ to, onClick, children }: { to?: string | null; onClick?: () => void; children: ReactNode }) {
  const className =
    'mx-auto mt-[30px] flex h-[35px] w-[194px] items-center justify-center border border-white text-[15px] font-extrabold transition-colors hover:bg-white hover:text-brand-deep'
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}
