import { Link } from 'react-router'
import { siDiscord, siFacebook, siInstagram, siReddit, siTrustpilot, siX } from 'simple-icons'
import { ENEBA_URL, TRUSTPILOT_URL, paymentLogo } from '../../lib/links'
import { toast } from '../../stores/toast'
import { useUi } from '../../stores/ui'
import { PathIcon } from '../ui/BrandIcon'
import { TRUSTPILOT_SCORE, TrustpilotStars } from '../ui/TrustpilotStars'
import { LocaleButton } from './SettingsModal'

const YEAR = new Date().getFullYear()

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
      ['About us', `${ENEBA_URL}/about-us`],
      ['Contact us', `${ENEBA_URL}/contacts`],
      ['Careers', 'https://jobs.ashbyhq.com/eneba'],
      ['Eneba Trust & Transparency', `${ENEBA_URL}/is-eneba-legit`],
    ],
  },
  {
    title: 'Buy',
    links: [
      ['How to buy', `${ENEBA_URL}/support/article/how-to-buy-on-eneba`],
      ['Collections', '/store'],
      ['Loyalty program', `${ENEBA_URL}/enebium`],
      ['Discounts', '/store?sort=discount'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['FAQ', `${ENEBA_URL}/support`],
      ['How to activate game', `${ENEBA_URL}/support/activation-guides`],
      ['Create a ticket', `${ENEBA_URL}/support`],
      ['Return policy', `${ENEBA_URL}/support/article/refund-after-product-purchase`],
      ['Content reporting', `${ENEBA_URL}/support/article/how-do-i-report-illegal-content`],
    ],
  },
  {
    title: 'Community',
    links: [
      ['Gaming news', `${ENEBA_URL}/hub/`],
      ['Giveaways', `${ENEBA_URL}/giveaways`],
      ['Become affiliate', `${ENEBA_URL}/become-affiliate`],
      ['Snakzy: Play and Earn', `${ENEBA_URL}/snakzy`],
    ],
  },
  {
    title: 'Business',
    links: [
      ['Sell on Eneba', `${ENEBA_URL}/sell-with-eneba`],
      ['Advertise with Us', `${ENEBA_URL}/promo/advertise-with-us`],
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
    <footer>
      <PaymentBar />
      <div className="bg-black/70">
        <div className="page-container pt-[60px] pb-10">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-[repeat(8,auto)] xl:justify-between">
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
                    <PathIcon path={s.icon.path} />
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

          <div className="mt-16 flex">
            <LocaleButton onClick={openSettings} className="h-[41px] border border-white px-3 text-base! font-extrabold!" />
          </div>

          <p className="mt-14 text-sm leading-6 text-soft">
            Copyright © {YEAR} Eneba. All Rights Reserved. JSC “Helis play”, Gyneju St. 4-333, Vilnius, the Republic of Lithuania{' '}
            <a href={`${ENEBA_URL}/terms-and-conditions`} target="_blank" rel="noreferrer" className="underline hover:text-white">
              Terms and Conditions
            </a>
            ,{' '}
            <a href={`${ENEBA_URL}/privacy-policy`} target="_blank" rel="noreferrer" className="underline hover:text-white">
              Privacy notice
            </a>
            ,{' '}
            <button type="button" onClick={() => toast.info('Only essential cookies are used.')} className="underline hover:text-white">
              Cookie preferences
            </button>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}

/** eneba.com pages open in a new tab; store pages navigate inside the app without a reload. */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = 'text-[15px] text-soft transition-colors hover:text-white'
  return href.startsWith('http') ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}

function PaymentBar() {
  return (
    <div className="bg-white">
      <div className="page-container flex h-11 items-center gap-8 overflow-x-auto md:gap-11">
        {PAYMENT_METHODS.map((m) => (
          <img
            key={m.file}
            src={paymentLogo(m.file)}
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
      <div className="flex h-full w-[45px] flex-col items-center justify-center bg-[#e4002b] leading-none font-extrabold">
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
  return (
    <a href={TRUSTPILOT_URL} target="_blank" rel="noreferrer" className="block w-fit" aria-label={`Trustpilot TrustScore ${TRUSTPILOT_SCORE} out of 5`}>
      <div className="flex items-center gap-1.5 text-lg font-bold">
        <PathIcon path={siTrustpilot.path} className="size-6 text-[#00b67a]" />
        Trustpilot
      </div>
      <div className="mt-1.5">
        <TrustpilotStars size="xl" />
      </div>
      <p className="mt-2 text-xs">
        TrustScore <span className="font-bold">{TRUSTPILOT_SCORE}</span> <span className="font-bold underline">333,898 reviews</span>
      </p>
    </a>
  )
}
