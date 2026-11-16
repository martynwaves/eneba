import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Currency } from '../lib/types'

interface SettingsState {
  region: string
  language: string
  currency: Currency
  save: (settings: { region: string; language: string; currency: Currency }) => void
}

const EURO: Currency = { code: 'EUR', name: 'Euro', symbol: '€', rate: 1 }

/** The visitor's region, language and display currency (prices are always charged in EUR). */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      region: 'lithuania',
      language: 'en-EU',
      currency: EURO,
      save: (settings) => set(settings),
    }),
    { name: 'eneba-settings' },
  ),
)

export const flagUrl = (flag: string) => `https://static.eneba.games/flags/lang/v2/${flag}.svg`
