import clsx from 'clsx'

/**
 * Eneba's wishlist ribbon, drawn as SVG so it can show an outline. Place it inside a button with
 * the `group/wish` class. Saved: solid green. Hovered (saved or not): the green gives way to a
 * darkened ribbon with a thin outline.
 */
export function WishRibbon({ saved, idle = 'none', notch = 0.78 }: { saved: boolean; idle?: 'none' | 'dark'; notch?: number }) {
  const tip = Math.round(100 * notch)
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <path
        d={`M1 1 V99 L50 ${tip} L99 99 V1 Z`}
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        className={clsx(
          'transition-[fill,stroke] duration-150 group-hover/wish:fill-black/45 group-hover/wish:stroke-white/80 group-focus-visible/wish:stroke-white/80',
          saved ? 'fill-green stroke-transparent' : idle === 'dark' ? 'fill-black/25 stroke-transparent' : 'fill-transparent stroke-transparent',
        )}
      />
    </svg>
  )
}
