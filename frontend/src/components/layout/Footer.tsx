import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { siDiscord, siFacebook, siInstagram, siReddit, siTrustpilot, siX } from 'simple-icons'
import { ApiError, api } from '../../lib/api'
import { useUi } from '../../stores/ui'
import { toast } from '../../stores/toast'
import { LocaleButton } from './SettingsModal'

const ENEBA = 'https://www.eneba.com'

const PAYMENT_METHODS = [
  { file: 'wallet', label: 'Eneba Wallet', className: 'h-[21px]' },
  { file: 'braintree_paypal', label: 'PayPal', className: 'h-[15px]' },
  { file: 'payrails_card', label: 'Visa and Mastercard', className: 'h-[21px]' },
  { file: 'payrails_apple_pay', label: 'Apple Pay', className: 'h-2' },
  { file: 'payrails_google_pay', label: 'Google Pay', className: 'h-2' },
  { file: 'nuvei_crypto', label: 'Pay with crypto', className: 'h-[21px]' },
]

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'About Eneba',
    links: [
      ['About us', `${ENEBA}/about-us`],
      ['Contact us', `${ENEBA}/contacts`],
      ['Careers', 'https://jobs.ashbyhq.com/eneba'],
      ['Eneba Trust & Transparency', `${ENEBA}/is-eneba-legit`],
    ],
  },
  {
    title: 'Buy',
    links: [
      ['How to buy', `${ENEBA}/support/article/how-to-buy-on-eneba`],
      ['Collections', '/store'],
      ['Loyalty program', `${ENEBA}/enebium`],
      ['Discounts', '/store?sort=discount'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['FAQ', `${ENEBA}/support`],
      ['How to activate game', `${ENEBA}/support/activation-guides`],
      ['Create a ticket', `${ENEBA}/support`],
      ['Return policy', `${ENEBA}/support/article/refund-after-product-purchase`],
      ['Content reporting', `${ENEBA}/support/article/how-do-i-report-illegal-content`],
    ],
  },
  {
    title: 'Community',
    links: [
      ['Gaming news', `${ENEBA}/hub/`],
      ['Giveaways', `${ENEBA}/giveaways`],
      ['Become affiliate', `${ENEBA}/become-affiliate`],
      ['Snakzy: Play and Earn', `${ENEBA}/snakzy`],
    ],
  },
  {
    title: 'Business',
    links: [
      ['Sell on Eneba', `${ENEBA}/sell-with-eneba`],
      ['Advertise with Us', `${ENEBA}/promo/advertise-with-us`],
    ],
  },
]

const SOCIALS = [
  { icon: siFacebook, href: 'https://www.facebook.com/enebaglobal/', label: 'Facebook' },
  { icon: siX, href: 'https://x.com/eneba_games', label: 'X' },
  { icon: siInstagram, href: 'https://www.instagram.com/enebagames/', label: 'Instagram' },
  { icon: siDiscord, href: 'https://discord.gg/enebagames', label: 'Discord' },
  { icon: siReddit, href: 'https://www.reddit.com/r/Enebagames/', label: 'Reddit' },
]

export function Footer() {
  const openSettings = useUi((s) => s.openSettings)

  return (
    <footer className="mt-0">
      <PaymentBar />
      <div className="bg-black/70">
        <div className="page-container pt-[60px] pb-10">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[repeat(8,auto)] lg:justify-between">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-base font-extrabold">{col.title}</h3>
                <ul className="space-y-[9px]">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <FooterLink href={href}>{label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="mb-4 text-base font-extrabold">Follow us</h3>
              <div className="flex items-center gap-4">
                {SOCIALS.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="text-white transition-colors hover:text-cta">
                    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                      <path d={s.icon.path} />
                    </svg>
                  </a>
                ))}
              </div>
              <PcMagBadge />
              <img src="https://static.eneba.games/d109b8436c8e285f7dbc.png" alt="Monster Energy" className="mt-4 h-[67px] w-auto" loading="lazy" />
            </div>

            <div>
              <h3 className="mb-4 text-base font-extrabold whitespace-nowrap">Download the App</h3>
              {/* Fixed width: the auto-sized grid column would otherwise squeeze the badges. */}
              <div className="flex flex-col gap-3">
                <a href="https://play.google.com/store/apps/details?id=com.eneba.app" target="_blank" rel="noreferrer">
                  <img src="https://static.eneba.games/mobile/v1/appAndroidCTA.svg" alt="Get it on Google Play" className="h-auto w-[158px] max-w-none" loading="lazy" />
                </a>
                <a href="https://apps.apple.com/app/apple-store/id1564406362" target="_blank" rel="noreferrer">
                  <img src="https://static.eneba.games/mobile/v1/appAppleCTA.svg" alt="Download on the App Store" className="h-auto w-[158px] max-w-none" loading="lazy" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-base font-extrabold">See our reviews on</h3>
              <TrustScore />
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <Newsletter />
            <LocaleButton onClick={openSettings} className="h-[41px] self-start border border-white px-3 text-base! font-extrabold! md:self-auto" />
          </div>

          <p className="mt-14 text-sm leading-6 text-soft">
            Copyright © {new Date().getFullYear()} Eneba. All Rights Reserved. JSC “Helis play”, Gyneju St. 4-333, Vilnius, the Republic of Lithuania{' '}
            <a href={`${ENEBA}/terms-and-conditions`} target="_blank" rel="noreferrer" className="underline hover:text-white">
              Terms and Conditions
            </a>
            ,{' '}
            <a href={`${ENEBA}/privacy-policy`} target="_blank" rel="noreferrer" className="underline hover:text-white">
              Privacy notice
            </a>
            ,{' '}
            <button type="button" onClick={() => toast.info('Only essential cookies are used in this demo.')} className="underline hover:text-white">
              Cookie preferences
            </button>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="text-[15px] text-soft transition-colors hover:text-white lg:whitespace-nowrap"
    >
      {children}
    </a>
  )
}

function PaymentBar() {
  return (
    <div className="bg-white">
      <div className="page-container flex h-11 items-center gap-8 overflow-x-auto md:gap-11">
        {PAYMENT_METHODS.map((m) => (
          <img
            key={m.file}
            src={`https://assets.eneba.games/payments/v1/color/${m.file}.svg`}
            alt={m.label}
            title={m.label}
            className={`${m.className} w-auto shrink-0`}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  )
}

function PcMagBadge() {
  return (
    <div className="mt-5 flex h-[49px] w-[150px] items-center overflow-hidden" aria-label="PCMag Editor's Choice" role="img">
      <div className="flex h-full w-[45px] flex-col items-center justify-center bg-[#e4002b] leading-none font-black">
        <span className="text-lg">PC</span>
        <span className="text-[9px] tracking-wider">MAG</span>
      </div>
      <div
        className="flex h-full flex-1 flex-col justify-center bg-[#e4002b] pl-2 text-[10px] leading-[13px] font-extrabold tracking-[0.18em]"
        style={{ clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', borderLeft: '1px solid rgba(255,255,255,.6)' }}
      >
        <span>EDITOR'S</span>
        <span>CHOICE</span>
      </div>
    </div>
  )
}

function TrustScore() {
  const score = 4.4
  return (
    <a href="https://www.trustpilot.com/review/eneba.com" target="_blank" rel="noreferrer" className="block w-fit" aria-label={`Trustpilot TrustScore ${score} out of 5`}>
      <div className="flex items-center gap-1.5 text-lg font-bold">
        <svg viewBox="0 0 24 24" className="size-6" fill="#00b67a" aria-hidden="true">
          <path d={siTrustpilot.path} />
        </svg>
        Trustpilot
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, score - i))
          return (
            <span key={i} className="relative grid size-[26px] place-items-center bg-[#dcdce6] sm:size-[33px]">
              <span className="absolute inset-y-0 left-0 bg-[#00b67a]" style={{ width: `${fill * 100}%` }} />
              <svg viewBox="0 0 24 24" className="relative size-6" fill="white" aria-hidden="true">
                <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
              </svg>
            </span>
          )
        })}
      </div>
      <p className="mt-2 text-xs">
        TrustScore <span className="font-bold">{score}</span> <span className="font-bold underline">333,898 reviews</span>
      </p>
    </a>
  )
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const subscribe = useMutation({
    mutationFn: () => api<{ message: string }>('/newsletter', { method: 'POST', body: { email } }),
    onSuccess: (r) => {
      toast.success(r.message)
      setEmail('')
    },
    onError: (e) => toast.error(e instanceof ApiError ? (e.field('email') ?? e.message) : 'Could not subscribe right now.'),
  })

  return (
    <form
      className="w-full max-w-[470px]"
      onSubmit={(e) => {
        e.preventDefault()
        subscribe.mutate()
      }}
    >
      <label htmlFor="newsletter-email" className="mb-4 block text-base font-extrabold">
        Get personalized game deals
      </label>
      <div className="flex h-[41px] border border-white">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="min-w-0 flex-1 bg-transparent px-4 text-base text-white placeholder:text-soft focus:outline-none"
        />
        <button type="submit" disabled={subscribe.isPending} className="border-l border-white px-3 text-base font-extrabold transition-colors hover:bg-white hover:text-brand-deep disabled:opacity-60">
          Subscribe
        </button>
      </div>
      <p className="mt-2 text-sm text-soft">
        You can unsubscribe at any time. Visit{' '}
        <a href={`${ENEBA}/privacy-policy`} target="_blank" rel="noreferrer" className="underline hover:text-white">
          Privacy notice
        </a>{' '}
        for more information
      </p>
    </form>
  )
}
