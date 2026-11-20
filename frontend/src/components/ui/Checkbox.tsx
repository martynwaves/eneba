import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

/** Eneba filter checkbox: 20px box, 2px translucent border, label left, count right. */
export function Checkbox({ checked, onChange, label, count }: { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; count?: number }) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-[7px] text-sm font-semibold leading-[17px]">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="grid size-5 shrink-0 place-items-center rounded-[3px] border-2 border-white/70 transition-colors group-hover:border-white peer-checked:border-cta peer-checked:bg-cta peer-focus-visible:outline-2 peer-focus-visible:outline-cta">
        {checked && <Check className="size-3.5 text-black" strokeWidth={4} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-white/70">{count}</span>}
    </label>
  )
}
