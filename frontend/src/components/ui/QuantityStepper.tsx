import { Minus, Plus } from 'lucide-react'

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number
  max: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const btn = 'grid size-8 place-items-center bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10'
  return (
    <div className="inline-flex items-center" role="group" aria-label="Quantity">
      <button type="button" className={btn} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        <Minus className="size-3.5" />
      </button>
      <span className="grid h-8 w-10 place-items-center text-sm font-extrabold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} disabled={disabled || value >= Math.min(max, 10)} onClick={() => onChange(value + 1)} aria-label="Increase quantity">
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
