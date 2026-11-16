import {
  siApple,
  siBattledotnet,
  siEa,
  siEpicgames,
  siGogdotcom,
  siGoogleplay,
  siKaspersky,
  siNetflix,
  siNordvpn,
  siPlaystation,
  siRiotgames,
  siRoblox,
  siRockstargames,
  siSpotify,
  siSteam,
  siUbisoft,
} from 'simple-icons'

interface IconData {
  path: string
  hex: string
  viewBox?: string
}

// Marks not available in simple-icons, drawn as simple geometric glyphs.
const CUSTOM: Record<string, IconData> = {
  xbox: {
    hex: '107C10',
    path: 'M12 2.2a9.8 9.8 0 0 0-6.4 2.4c1.9-.9 4.6 1.2 6.4 2.7 1.8-1.5 4.5-3.6 6.4-2.7A9.8 9.8 0 0 0 12 2.2Zm-7.6 3.6A9.8 9.8 0 0 0 7 20.6C4.6 17.9 5.6 12 9.7 9 7.6 6.8 5.4 5.3 4.4 5.8Zm15.2 0c-1-.5-3.2 1-5.3 3.2 4.1 3 5.1 8.9 2.7 11.6a9.8 9.8 0 0 0 2.6-14.8ZM12 11.1c-3 2.6-6.2 7.3-4 9.8a9.8 9.8 0 0 0 8 0c2.2-2.5-1-7.2-4-9.8Z',
  },
  nintendo: {
    hex: 'E60012',
    path: 'M8.6 2h3.2v20H8.6A6.6 6.6 0 0 1 2 15.4V8.6A6.6 6.6 0 0 1 8.6 2Zm-.3 3.4a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6ZM13.2 2h2.2A6.6 6.6 0 0 1 22 8.6v6.8a6.6 6.6 0 0 1-6.6 6.6h-2.2V2Zm2.7 11.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z',
  },
  windows: {
    hex: '0078D4',
    path: 'M2 4.4 10.2 3.3v7.9H2V4.4Zm0 15.2 8.2 1.1v-7.8H2v6.7Zm9.1 1.2L22 22.3v-9.4H11.1v7.9Zm0-17.6v8H22V1.7L11.1 3.2Z',
  },
  office: {
    hex: 'D83B01',
    path: 'M3 5.3 14.6 1.6l6.4 2.1v16.6l-6.4 2.1L3 18.7l11.6 1.6V5.4L6.5 7.2v9.6L3 18.7V5.3Z',
  },
}

const SIMPLE: Record<string, IconData> = {
  steam: siSteam,
  playstation: siPlaystation,
  epicgames: siEpicgames,
  gog: siGogdotcom,
  ea: siEa,
  ubisoft: siUbisoft,
  rockstar: siRockstargames,
  battledotnet: siBattledotnet,
  roblox: siRoblox,
  spotify: siSpotify,
  netflix: siNetflix,
  apple: siApple,
  googleplay: siGoogleplay,
  riotgames: siRiotgames,
  nordvpn: siNordvpn,
  kaspersky: siKaspersky,
}

// Platform slugs from the API => brand key above.
const PLATFORM_BRAND: Record<string, string> = {
  steam: 'steam',
  psn: 'playstation',
  'xbox-live': 'xbox',
  'nintendo-eshop': 'nintendo',
  'ea-app': 'ea',
  'ubisoft-connect': 'ubisoft',
  rockstar: 'rockstar',
  gog: 'gog',
  'epic-games': 'epicgames',
  'battle-net': 'battledotnet',
  'microsoft-store': 'windows',
}

export function brandData(brand: string): IconData | undefined {
  return CUSTOM[brand] ?? SIMPLE[brand]
}

export function BrandIcon({ brand, className = 'size-4', colored = false }: { brand: string; className?: string; colored?: boolean }) {
  const data = brandData(brand)
  if (!data) return null
  return (
    <svg viewBox={data.viewBox ?? '0 0 24 24'} className={className} fill={colored ? `#${data.hex}` : 'currentColor'} aria-hidden="true">
      <path d={data.path} />
    </svg>
  )
}

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const brand = PLATFORM_BRAND[platform]
  if (!brand) {
    return (
      <svg viewBox="0 0 24 24" className={className ?? 'size-4'} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8Zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    )
  }
  return <BrandIcon brand={brand} className={className} />
}

export function brandColor(brand: string): string {
  return `#${brandData(brand)?.hex ?? '5825cc'}`
}
