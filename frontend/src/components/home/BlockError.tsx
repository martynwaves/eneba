import { RefreshCw } from 'lucide-react'

/** A failing block degrades on its own; the rest of the homepage keeps working. */
export function BlockError({ onRetry, title }: { onRetry: () => void; title?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-brand-deep/60 px-5 py-4 text-sm">
      <span className="text-muted">{title ? `“${title}” could not be loaded.` : 'This section could not be loaded.'}</span>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 font-extrabold text-cta hover:underline">
        <RefreshCw className="size-4" /> Retry
      </button>
    </div>
  )
}
