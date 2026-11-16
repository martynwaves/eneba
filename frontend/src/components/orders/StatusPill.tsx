import clsx from 'clsx'
import type { OrderStatus } from '../../lib/types'

const STYLES: Record<OrderStatus, string> = {
  paid: 'bg-green/15 text-green',
  pending: 'bg-cta/15 text-cta',
  failed: 'bg-danger/15 text-danger',
  expired: 'bg-white/10 text-muted',
  cancelled: 'bg-white/10 text-muted',
  refunded: 'bg-white/10 text-soft',
}

const LABELS: Record<OrderStatus, string> = {
  paid: 'Completed',
  pending: 'Awaiting payment',
  failed: 'Failed',
  expired: 'Expired',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={clsx('inline-block px-2.5 py-1 text-xs font-extrabold uppercase', STYLES[status])}>{LABELS[status]}</span>
}
