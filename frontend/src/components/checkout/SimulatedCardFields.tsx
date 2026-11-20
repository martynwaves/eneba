import type { SimulatedCard } from '../../lib/simulatedPayment'

/** Card fields used when the backend runs without Stripe keys. Behaves like Stripe's test mode. */
export function SimulatedCardFields({ value, onChange }: { value: SimulatedCard; onChange: (card: SimulatedCard) => void }) {
  const input = 'h-11 w-full border border-white/25 bg-[#2a0d6b] px-3 text-base font-semibold text-white focus:border-cta focus:outline-none'
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-xs text-soft">Card number</span>
        <input
          className={input}
          inputMode="numeric"
          autoComplete="off"
          value={value.number}
          onChange={(e) => onChange({ ...value, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) })}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs text-soft">Expiration</span>
          <input className={input} autoComplete="off" value={value.expiry} onChange={(e) => onChange({ ...value, expiry: e.target.value.slice(0, 7) })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-soft">CVC</span>
          <input
            className={input}
            inputMode="numeric"
            autoComplete="off"
            value={value.cvc}
            onChange={(e) => onChange({ ...value, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          />
        </label>
      </div>
      <p className="text-xs text-soft">Test mode: 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 is declined. No real payment is made.</p>
    </div>
  )
}
