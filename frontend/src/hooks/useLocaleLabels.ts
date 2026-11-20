import { useSettingsOptions } from '../api/queries'
import { useSettings } from '../stores/settings'

/** Display names for the visitor's chosen language and region flag (header, footer, sign-in page). */
export function useLocaleLabels() {
  const { region, language, currency } = useSettings()
  const { data: options } = useSettingsOptions()
  return {
    languageName: options?.languages.find((l) => l.code === language)?.name ?? 'English EU',
    flag: options?.regions.find((r) => r.code === region)?.flag ?? region,
    currencyCode: currency.code,
  }
}
