import { Globe } from 'lucide-react'
import { Link, Outlet, ScrollRestoration } from 'react-router'
import { useLocaleLabels } from '../../hooks/useLocaleLabels'
import { ENEBA_URL, LOGO_URL } from '../../lib/links'
import { toast } from '../../stores/toast'
import { useUi } from '../../stores/ui'
import { SettingsModal } from './SettingsModal'
import { Toaster } from './Toaster'

const YEAR = new Date().getFullYear()

/** Eneba's standalone sign-in layout: logo, greeting on the left, form card on the right. */
export function AuthLayout() {
  const { settingsOpen, openSettings, closeSettings } = useUi()
  const { languageName } = useLocaleLabels()

  return (
    <div className="flex min-h-screen flex-col bg-[#210b54]">
      <header className="px-5 pt-5 md:px-6">
        <Link to="/" aria-label="Eneba home" className="inline-block">
          <img src={LOGO_URL} alt="Eneba logo" width={155} height={48} className="h-10 w-auto md:h-12" />
        </Link>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-[1340px] items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_auto] lg:px-[100px]">
          <p className="hidden text-[56px] leading-[1.15] font-bold lg:block xl:text-[80px]" aria-hidden="true">
            Hi!
            <br />
            It’s nice to see you!
          </p>
          <div className="mx-auto w-full max-w-[380px]">
            <Outlet />
          </div>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 pt-4 pb-5 text-sm">
        <button type="button" onClick={openSettings} className="flex items-center gap-1.5 hover:text-cta">
          <Globe className="size-4" />
          {languageName}
        </button>
        <a href={`${ENEBA_URL}/terms-and-conditions`} target="_blank" rel="noreferrer" className="font-extrabold hover:text-cta">
          Terms &amp; Conditions
        </a>
        <a href={`${ENEBA_URL}/privacy-policy`} target="_blank" rel="noreferrer" className="font-extrabold hover:text-cta">
          Privacy notice
        </a>
        <button type="button" onClick={() => toast.info('Only essential cookies are used.')} className="font-extrabold hover:text-cta">
          Cookie preferences
        </button>
        <a href={`${ENEBA_URL}/support`} target="_blank" rel="noreferrer" className="font-extrabold hover:text-cta">
          Support
        </a>
        <span>Copyright © {YEAR} Eneba. All Rights Reserved.</span>
      </footer>

      <Toaster />
      {settingsOpen && <SettingsModal onClose={closeSettings} />}
      <ScrollRestoration />
    </div>
  )
}
