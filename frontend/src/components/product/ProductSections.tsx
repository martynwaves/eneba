import clsx from 'clsx'
import { useState } from 'react'
import { Link } from 'react-router'
import { formatDate } from '../../lib/format'
import type { OperatingSystem, ProductDetail } from '../../lib/types'
import { Stars } from '../ui/Stars'

const OS_LABELS: Record<OperatingSystem, string> = { windows: 'Windows', mac: 'Mac', linux: 'Linux' }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 text-[21px] font-extrabold">{children}</h2>
}

function Tabs<T extends string>({ tabs, active, onChange, upper = false }: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void; upper?: boolean }) {
  return (
    <div role="tablist" className="flex overflow-x-auto bg-black/40">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            'shrink-0 px-6 py-[18px] text-[15px] transition-colors',
            upper && 'tracking-wide uppercase',
            active === t.id ? 'bg-black/25 font-extrabold' : 'text-white/80 hover:text-white',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Genre chips, then "Description" / "Activation guide" tabs. */
export function ProductDetailsSection({ product, tab, onTab }: { product: ProductDetail; tab: 'description' | 'activation'; onTab: (t: 'description' | 'activation') => void }) {
  return (
    <section aria-label="Product details" id="product-details" className="scroll-mt-4">
      <SectionTitle>Product Details</SectionTitle>
      {product.genres.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {product.genres.map((g) => (
            <Link key={g.slug} to={`/store?genre=${g.slug}`} className="rounded-full bg-black/30 px-3 py-1 text-[15px] hover:bg-black/50">
              {g.name}
            </Link>
          ))}
        </div>
      )}
      <Tabs
        tabs={[
          { id: 'description', label: 'Description' },
          { id: 'activation', label: 'Activation guide' },
        ]}
        active={tab}
        onChange={onTab}
      />
      <div className="bg-black/25 px-6 pt-10 pb-6">{tab === 'description' ? <Description product={product} /> : <ActivationGuide product={product} />}</div>
    </section>
  )
}

function Description({ product }: { product: ProductDetail }) {
  const [expanded, setExpanded] = useState(false)
  const paragraphs = (product.description ?? '').split('\n').map((p) => p.trim()).filter(Boolean)

  return (
    <div>
      <h3 className="text-[19px] font-extrabold">{product.base_title}</h3>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <Stars value={product.rating_avg} className="size-6" />
        {product.rating_count > 0 ? (
          <span>
            {product.rating_avg.toFixed(1)} ({product.rating_count} {product.rating_count === 1 ? 'review' : 'reviews'})
          </span>
        ) : (
          <a href="#reviews" className="hover:underline">
            Be first to rate!
          </a>
        )}
      </div>

      <div className={clsx('relative mt-6 overflow-hidden', !expanded && 'max-h-[420px]')}>
        <div className="space-y-4 text-justify text-[15px] leading-[25px] text-white/90">
          <h4 className="text-[19px] font-extrabold text-white">
            {product.base_title} {product.activation.key_label}
          </h4>
          {paragraphs.map((p, i) => (
            <p key={`d${i}`}>{p}</p>
          ))}
          {product.about.map((block, i) =>
            block.type === 'heading' ? (
              <h4 key={`a${i}`} className="pt-2 text-[19px] font-extrabold text-white">
                {block.text}
              </h4>
            ) : (
              <p key={`a${i}`}>{block.text}</p>
            ),
          )}
        </div>
        {!expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#371a7c] to-transparent" />}
      </div>
      <div className="mt-4 text-center">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="text-[15px] text-cta hover:underline">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      </div>
    </div>
  )
}

function ActivationGuide({ product }: { product: ProductDetail }) {
  const { platform, url } = product.activation
  const pc = product.platform.family === 'pc'
  const steps = [
    pc ? `Download and install the ${platform} client, if you don't have it yet.` : `Sign in to your ${platform} account on your console or in the web store.`,
    pc ? `Log in to your ${platform} account (or create a new one).` : 'Make sure the account region matches the key region shown on this page.',
    'Open your Eneba order (Account → Orders) and reveal the key.',
    `Choose the option to redeem or activate a code in ${platform} and enter the key.`,
    'Confirm, and the product is added to your library, ready to download.',
  ]
  return (
    <div className="text-[15px] leading-[25px]">
      <h3 className="text-[19px] font-extrabold">How to activate your {platform} key</h3>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-white/90">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="mt-5 inline-block text-cta hover:underline">
          Official {platform} activation guide
        </a>
      )}
    </div>
  )
}

/** Turns Steam's "Label: value" requirement lines into table rows. */
function requirementRows(text: string): [string, string][] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): [string, string] => {
      if (/requires a 64-bit/i.test(line)) return ['64bit support', 'Yes']
      const at = line.indexOf(': ')
      if (at > 0 && at < 30) {
        const label = line.slice(0, at)
        return [label === 'OS' ? 'System requirements' : label, line.slice(at + 2)]
      }
      return ['', line]
    })
}

export function SystemRequirements({ product }: { product: ProductDetail }) {
  const available = (Object.keys(OS_LABELS) as OperatingSystem[]).filter((os) => product.platform_requirements[os]?.minimum || product.platform_requirements[os]?.recommended)
  const [os, setOs] = useState<OperatingSystem>(available[0] ?? 'windows')
  if (available.length === 0) return null
  const current = product.platform_requirements[os] ?? {}

  return (
    <section aria-label="System requirements" id="requirements" className="scroll-mt-4">
      <SectionTitle>System requirements</SectionTitle>
      <Tabs tabs={available.map((id) => ({ id, label: OS_LABELS[id] }))} active={os} onChange={setOs} upper />
      <div className="space-y-8 bg-black/25 px-6 pt-8 pb-6">
        {(['minimum', 'recommended'] as const).map((level) =>
          current[level] ? (
            <div key={level}>
              <h3 className="mb-3 text-[17px] font-extrabold">{level === 'minimum' ? 'Minimum' : 'Recommended'} system requirements</h3>
              <table className="text-[15px] leading-[26px]">
                <tbody>
                  {requirementRows(current[level]!).map(([label, value], i) => (
                    <tr key={i}>
                      <th scope="row" className="pr-6 text-right align-top font-normal whitespace-nowrap text-white/70">
                        {label}
                      </th>
                      <td className="text-white/95">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null,
        )}
      </div>
    </section>
  )
}

export function OtherDetails({ product }: { product: ProductDetail }) {
  const rows: [string, React.ReactNode][] = [
    ['Languages', product.languages.length ? product.languages.map((l) => <div key={l}>{l}</div>) : null],
    ['Release date', product.release_date ? formatDate(product.release_date) : null],
    ['Publisher', product.publisher],
    ['Developers', product.developer],
    ['Works on', product.operating_systems.length ? product.operating_systems.map((o) => <div key={o}>{OS_LABELS[o as OperatingSystem] ?? o}</div>) : null],
  ]
  const shown = rows.filter(([, v]) => v !== null && v !== '')
  if (shown.length === 0) return null

  return (
    <section aria-label="Other details">
      <SectionTitle>Other details</SectionTitle>
      <div className="bg-black/25 px-6 py-7 md:px-9">
        <table className="text-[15px] leading-5">
          <tbody>
            {shown.map(([label, value]) => (
              <tr key={label}>
                <th scope="row" className="pr-6 pb-3 text-right align-top font-normal whitespace-nowrap text-white/70">
                  {label}
                </th>
                <td className="pb-3">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
