import clsx from 'clsx'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { useToasts } from '../../stores/toast'

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 md:right-6 md:left-auto md:items-end" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex w-full max-w-sm items-center gap-3 border-l-4 bg-brand-deep px-4 py-3 shadow-2xl shadow-black/50',
            t.tone === 'success' && 'border-green',
            t.tone === 'error' && 'border-danger',
            t.tone === 'info' && 'border-cta',
          )}
        >
          {t.tone === 'success' && <CheckCircle2 className="size-5 shrink-0 text-green" />}
          {t.tone === 'error' && <XCircle className="size-5 shrink-0 text-danger" />}
          {t.tone === 'info' && <Info className="size-5 shrink-0 text-cta" />}
          <p className="flex-1 text-sm font-semibold">{t.message}</p>
          {t.action && (
            <Link to={t.action.href} onClick={() => dismiss(t.id)} className="text-sm font-extrabold text-cta hover:underline">
              {t.action.label}
            </Link>
          )}
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-white/60 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
