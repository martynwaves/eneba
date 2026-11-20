import { useCallback, useState } from 'react'
import { useLocation } from 'react-router'

/**
 * Open/closed state for a menu that closes by itself when the visitor navigates: the menu
 * remembers the URL it was opened on, so it counts as closed anywhere else.
 */
export function useMenuState() {
  const location = useLocation()
  const url = location.pathname + location.search
  const [openOn, setOpenOn] = useState<string | null>(null)

  const setOpen = useCallback(
    (next: boolean | ((open: boolean) => boolean)) =>
      setOpenOn((current) => ((typeof next === 'function' ? next(current === url) : next) ? url : null)),
    [url],
  )

  return [openOn === url, setOpen] as const
}
