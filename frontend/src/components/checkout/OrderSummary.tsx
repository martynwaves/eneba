import type { ReactNode } from 'react'
import { formatPrice } from '../../lib/format'

function SummaryRow({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className={strong ? 'flex items-baseline justify-between text-lg font-extrabold' : 'flex justify-between text-sm text-soft'}>
      <span>{label}</span>
      <span className={strong ? 'text-2xl' : 'font-semibold text-white'}>{value}</span>
    </div>
  )
}

/** Payment summary of a placed order. A zero service fee shows as "--", like in the cart. */
export function Totals({ subtotal, fee, discount = 0, total, refunded = 0 }: { subtotal: number; fee: number; discount?: number; total: number; refunded?: number }) {
  return (
    <div className="space-y-2.5">
      <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
      <SummaryRow label="Service fee" value={fee > 0 ? formatPrice(fee) : '--'} />
      {discount > 0 && <SummaryRow label="Discount" value={`−${formatPrice(discount)}`} />}
      <div className="border-t border-white/15 pt-3">
        <SummaryRow label="Total" value={formatPrice(total)} strong />
      </div>
      {refunded > 0 && <SummaryRow label="Refunded keys" value={`−${formatPrice(refunded)}`} />}
    </div>
  )
}
