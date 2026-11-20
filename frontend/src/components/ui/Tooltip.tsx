import clsx from 'clsx'
import { CircleHelp, Info } from 'lucide-react'
import { useId, useState } from 'react'

/**
 * An icon button that explains something. Opens on hover, focus or tap, so keyboard and touch
 * users can read it too; closes when the pointer or focus leaves, or on Escape. A click opens
 * rather than toggles: a tap also fires hover and focus first, so a toggle would close it again.
 */
function Tooltip({ text, variant }: { text: string; variant: 'info' | 'help' }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const Icon = variant === 'info' ? Info : CircleHelp

  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label="More information"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="grid place-items-center text-white/70 transition-colors hover:text-white"
      >
        <Icon className="size-4" strokeWidth={variant === 'info' ? 2.2 : 2} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={clsx(
            'absolute bottom-full left-1/2 z-50 -translate-x-1/2 bg-[#221f2e] font-normal tracking-normal text-white shadow-xl shadow-black/40',
            variant === 'info'
              ? 'mb-3 w-[min(480px,85vw)] px-4 py-3.5 text-[15px] leading-8 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-[10px] after:border-t-[10px] after:border-x-transparent after:border-t-[#221f2e]'
              : 'mb-2 w-56 px-3 py-2 text-xs leading-5',
          )}
        >
          {text}
        </span>
      )}
    </span>
  )
}

/** Eneba's "i" bubble with a large explanation (section titles, prices, offers). */
export function InfoTooltip({ text }: { text: string }) {
  return <Tooltip text={text} variant="info" />
}

/** The small "?" hint used for "Digital product", "Service fee" and seller ratings. */
export function HelpTip({ text }: { text: string }) {
  return <Tooltip text={text} variant="help" />
}
