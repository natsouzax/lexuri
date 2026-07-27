'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * True once the user has scrolled down past `threshold` — flips back to
 * false as soon as they scroll up, or whenever they're near the top.
 * Used to slide headers/hero banners out of view while scrolling down,
 * reclaiming space, without permanently losing them.
 */
export function useHideOnScroll(threshold = 40) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      const delta = y - lastY.current
      if (y < threshold) setHidden(false)
      else if (delta > 6) setHidden(true)
      else if (delta < -6) setHidden(false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return hidden
}
