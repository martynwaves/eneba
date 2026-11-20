import { useSettingsOptions } from '../api/queries'
import { useSettings } from '../stores/settings'

/** Whether a key's region can be redeemed in the visitor's chosen country. */
export function useRegionCheck() {
  const region = useSettings((s) => s.region)
  const { data: options } = useSettingsOptions()
  const country = options?.regions.find((r) => r.code === region)
  return (productRegion: string) => ({
    ok: !country || country.product_regions.includes(productRegion),
    country: country?.name ?? '',
  })
}
