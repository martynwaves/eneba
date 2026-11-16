import clsx from 'clsx'
import { Info } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'

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

export function InfoTooltip({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span className={clsx('relative inline-flex', className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label="More information"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="grid place-items-center text-white/70 transition-colors hover:text-white"
      >
        <Info className="size-4" strokeWidth={2.2} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-3 w-[min(480px,85vw)] -translate-x-1/2 bg-[#221f2e] px-4 py-3.5 text-[15px] leading-8 font-normal tracking-normal text-white shadow-xl shadow-black/40 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-[10px] after:border-t-[10px] after:border-x-transparent after:border-t-[#221f2e]"
        >
          {text}
        </span>
      )}
    </span>
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
