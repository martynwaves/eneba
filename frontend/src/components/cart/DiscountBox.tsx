import { Check, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { useAppConfig } from '../../api/queries'
import type { CartSummary } from '../../lib/types'
import { useDiscount } from '../../stores/discount'

const ENEBA = 'https://www.eneba.com'

/**
 * "Got discount code?" on the cart page. The code is stored client-side and priced by the
 * server on every cart request, so a code that stops qualifying (e.g. the cart drops below its
 * minimum) shows its reason here instead of silently vanishing.
 */
export function DiscountBox({ summary, settled }: { summary: CartSummary; settled: boolean }) {
  const { code, apply, clear } = useDiscount()
  const [open, setOpen] = useState(code !== null)
  const [value, setValue] = useState(code ?? '')
  const [inputError, setInputError] = useState<string | null>(null)
  const inputId = useId()
  const demoCodes = useAppConfig().data?.demo_discount_codes ?? []

  const applyDemoCode = (demo: string) => {
    setOpen(true)
    setValue(demo)
    setInputError(null)
    apply(demo)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      setInputError('Enter a discount code.')
      return
    }
    setInputError(null)
    apply(value)
  }

  const applied = summary.discount_code
  // The server's verdict applies only while the box still shows the code it judged.
  const serverError = code && settled && value.trim().toUpperCase() === code ? summary.discount_error : null
  const error = inputError ?? serverError

  return (
    <div className="border-t border-white/10 px-6 py-4 md:px-9">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-[15px] font-semibold hover:text-cta"
      >
        Got discount code?
        <ChevronDown className={`size-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3">
          {applied ? (
            <div className="flex items-center justify-between gap-3 bg-black/30 px-3 py-2.5">
              <span className="flex items-center gap-2 text-[15px]">
                <Check className="size-4 text-green" strokeWidth={3} />
                <span className="font-extrabold">{applied}</span>
                <span className="text-soft">applied</span>
              </span>
              <button type="button" onClick={clear} className="text-sm font-semibold text-cta hover:underline">
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex gap-2.5" noValidate>
              <label htmlFor={inputId} className="sr-only">
                Discount code
              </label>
              <input
                id={inputId}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setInputError(null)
                }}
                placeholder="Enter code"
                autoComplete="off"
                maxLength={40}
                aria-invalid={error !== null}
                className={`h-11 min-w-0 flex-1 bg-black/40 px-3.5 text-[15px] uppercase placeholder:text-white/40 placeholder:normal-case focus:outline-2 focus:outline-cta ${error ? 'outline-2 outline-danger' : ''}`}
              />
              <button
                type="submit"
                disabled={code !== null && !settled}
                className="h-11 shrink-0 border border-white px-6 text-[15px] font-extrabold transition-colors hover:bg-white hover:text-black disabled:opacity-50"
              >
                Apply
              </button>
            </form>
          )}
          {error && (
            <p className="mt-2 text-[13px] font-semibold text-danger" role="alert">
              {error}
            </p>
          )}
          <p className="mt-2.5 text-[13px] text-soft">
            <a href={`${ENEBA}/coupon-terms-and-conditions`} target="_blank" rel="noreferrer" className="text-cta hover:underline">
              ENEBA Coupon Terms and Conditions
            </a>{' '}
            apply to the use of coupons
          </p>
        </div>
      )}

      {demoCodes.length > 0 && (
        <div className="mt-4 border-l-4 border-cta bg-black/20 px-4 py-3 text-xs text-soft">
          <strong className="text-white">Demo discount codes.</strong> Click one to apply it:
          <ul className="mt-2 space-y-1.5">
            {demoCodes.map((demo) => (
              <li key={demo.code} className="flex flex-wrap items-center gap-x-2">
                <button
                  type="button"
                  onClick={() => applyDemoCode(demo.code)}
                  className={`border px-1.5 py-0.5 font-extrabold tracking-wide transition-colors ${applied === demo.code ? 'border-green text-green' : 'border-white/40 text-white hover:border-cta hover:text-cta'}`}
                >
                  {demo.code}
                </button>
                <span>{demo.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** "Discount (CODE)  −€X" row shared by the cart, cart dropdown and checkout summaries. */
export function DiscountRow({ code, amount, format }: { code: string | null; amount: number; format: (cents: number) => string }) {
  if (amount <= 0) return null
  return (
    <div className="flex justify-between text-green">
      <span>Discount{code ? ` (${code})` : ''}</span>
      <span className="font-extrabold">−{format(amount)}</span>
    </div>
  )
}
