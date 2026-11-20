import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Eye, KeyRound, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { ApiError, api } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import type { KeyRefund } from '../../lib/types'
import { toast } from '../../stores/toast'
import { Button } from '../ui/Button'

/** "Refunded €19.00 to your card and €4.00 to your Eneba Wallet." */
function refundMessage({ to_card, to_wallet }: KeyRefund): string {
  const parts = [to_card > 0 && `${formatPrice(to_card)} to your card`, to_wallet > 0 && `${formatPrice(to_wallet)} to your Eneba Wallet`].filter(Boolean)
  return parts.length ? `Refunded ${parts.join(' and ')}.` : 'Key refunded.'
}

/**
 * A purchased key (order page and keys library). Revealing shows the code for good; until then
 * the buyer can refund the key instead, which puts it back on sale.
 */
export function KeyRow({
  keyId,
  index,
  revealed,
  initialCode = null,
  refundAmount = null,
  orderNumber,
}: {
  keyId: number
  /** Position within its order line; leave out when the row stands alone. */
  index?: number
  revealed: boolean
  initialCode?: string | null
  /** What a refund returns; null when the key can't be refunded (already revealed). */
  refundAmount?: number | null
  orderNumber: string
}) {
  const [code, setCode] = useState<string | null>(initialCode)
  const [copied, setCopied] = useState(false)
  const [confirmingRefund, setConfirmingRefund] = useState(false)
  const qc = useQueryClient()

  // Cached orders and the keys library would otherwise show the key in its old state.
  const refreshKeyViews = () => {
    qc.invalidateQueries({ queryKey: ['order', orderNumber] })
    qc.invalidateQueries({ queryKey: ['orders'] })
    qc.invalidateQueries({ queryKey: ['keys'] })
  }

  const reveal = useMutation({
    mutationFn: () => api<{ data: { code: string } }>(`/orders/${orderNumber}/keys/${keyId}/reveal`, { method: 'POST' }),
    onSuccess: (r) => {
      setCode(r.data.code)
      refreshKeyViews()
    },
    onError: () => toast.error('Could not reveal the key. Please try again.'),
  })

  const refund = useMutation({
    mutationFn: () => api<{ refund: KeyRefund }>(`/orders/${orderNumber}/keys/${keyId}/refund`, { method: 'POST' }),
    onSuccess: (r) => {
      toast.success(refundMessage(r.refund))
      refreshKeyViews()
      qc.invalidateQueries({ queryKey: ['me'] }) // wallet balance
    },
    onError: (e) => {
      setConfirmingRefund(false)
      toast.error(e instanceof ApiError ? (e.field('key') ?? e.message) : 'Could not refund the key. Please try again.')
    },
  })

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copying is blocked in this browser. Select the key and copy it instead.')
    }
  }

  const canRefund = !code && !revealed && refundAmount !== null

  return (
    <div className="flex flex-wrap items-center gap-3 bg-black/25 px-4 py-3">
      <KeyRound className="size-5 text-cta" />
      <span className="text-xs font-extrabold text-muted">{index ? `Key ${index}` : 'Key'}</span>
      <code className="flex-1 font-mono text-base font-bold tracking-wider" aria-live="polite">
        {code ?? '•••••-•••••-•••••'}
      </code>
      {code ? (
        <Button variant="outline" size="sm" onClick={copy} icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      ) : confirmingRefund ? (
        <div className="flex items-center gap-2" role="group" aria-label="Confirm refund">
          <Button size="sm" onClick={() => refund.mutate()} loading={refund.isPending}>
            Refund {formatPrice(refundAmount)}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmingRefund(false)} disabled={refund.isPending}>
            Keep key
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {canRefund && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmingRefund(true)} icon={<Undo2 className="size-4" />}>
              Refund
            </Button>
          )}
          <Button size="sm" onClick={() => reveal.mutate()} loading={reveal.isPending} icon={<Eye className="size-4" />}>
            {revealed ? 'Show key' : 'Reveal key'}
          </Button>
        </div>
      )}
      {canRefund && (
        <span className="w-full text-[11px] text-muted">
          {confirmingRefund
            ? 'The key goes back on sale and the money goes back the way you paid. Any cashback it earned stays in your wallet.'
            : 'Unrevealed keys can be refunded instantly. Revealing a key means it can no longer be refunded.'}
        </span>
      )}
    </div>
  )
}
