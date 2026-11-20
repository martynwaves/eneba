import { ChevronDown, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useSettingsOptions } from '../../api/queries'
import { useLocaleLabels } from '../../hooks/useLocaleLabels'
import { flagUrl, useSettings } from '../../stores/settings'
import { toast } from '../../stores/toast'
import { Spinner } from '../ui/Spinner'

/** Eneba's "Update your settings" popup: region, language and display currency. */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { data: options, isLoading } = useSettingsOptions()
  const settings = useSettings()
  const [region, setRegion] = useState(settings.region)
  const [language, setLanguage] = useState(settings.language)
  const [currencyCode, setCurrencyCode] = useState(settings.currency.code)
  const dialog = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLElement>('select, button')?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const save = () => {
    const currency = options?.currencies.find((c) => c.code === currencyCode)
    if (!currency) return
    settings.save({ region, language, currency })
    if (currency.code !== options?.charge_currency) {
      toast.info(`Prices are now shown in ${currencyCode}. Payments are still charged in ${options?.charge_currency}.`)
    }
    onClose()
  }

  const selectedRegion = options?.regions.find((r) => r.code === region)

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="presentation">
      <button type="button" aria-label="Close settings" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[380px] bg-brand px-7 pt-10 pb-7 shadow-2xl shadow-black/60"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-3.5 right-3.5 text-white hover:text-cta">
          <X className="size-5" />
        </button>
        <h2 id={titleId} className="text-xl leading-tight font-extrabold">
          Update your settings
        </h2>
        <p className="mt-2.5 text-sm leading-6 text-soft">Set your preferred region, language, and the currency.</p>

        {isLoading || !options ? (
          <div className="grid h-48 place-items-center">
            <Spinner className="size-8 text-cta" />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <SelectField
              label="Region"
              value={region}
              onChange={setRegion}
              icon={selectedRegion && <img src={flagUrl(selectedRegion.flag)} alt="" className="size-[18px] rounded-full" />}
              options={options.regions.map((r) => ({ value: r.code, label: r.name }))}
            />
            <SelectField
              label="Language"
              value={language}
              onChange={setLanguage}
              options={options.languages.map((l) => ({ value: l.code, label: l.name }))}
            />
            <SelectField
              label="Currency"
              value={currencyCode}
              onChange={setCurrencyCode}
              options={options.currencies.map((c) => ({ value: c.code, label: `${c.name} (${c.symbol})` }))}
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="h-[35px] w-[104px] border border-white text-[15px] font-extrabold hover:bg-white hover:text-brand">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={!options} className="h-[35px] w-[104px] bg-cta text-[15px] font-extrabold text-black hover:bg-cta-hover disabled:opacity-50">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  icon?: ReactNode
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-extrabold">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">{icon}</span>}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full cursor-pointer appearance-none border border-black/20 bg-black/25 pr-10 text-[15px] text-soft focus:border-cta focus:outline-none [&>option]:bg-brand-deep ${icon ? 'pl-9' : 'pl-3'}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" strokeWidth={3} />
      </div>
    </div>
  )
}

/** The "flag English EU | EUR" button used in the header and footer. */
export function LocaleButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  const { languageName, flag, currencyCode } = useLocaleLabels()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Region, language and currency: ${languageName}, ${currencyCode}`}
      className={`group/locale flex items-center gap-2 text-sm font-semibold transition-colors hover:text-cta ${className}`}
    >
      <img src={flagUrl(flag)} alt="" className="size-4 rounded-full" />
      <span>{languageName}</span>
      <span className="text-white/50 group-hover/locale:text-cta/60">|</span>
      <span>{currencyCode}</span>
    </button>
  )
}
