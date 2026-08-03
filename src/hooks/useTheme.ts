import { useCallback } from 'react'
import { useHtmlPreference } from '@/hooks/useHtmlPreference'

export type Theme = 'light' | 'dark'

const THEMES = ['light', 'dark'] as const

/**
 * Light is the product default rather than the OS preference — the brand and
 * the glass surfaces are tuned for it. This only applies on a first visit;
 * once the user toggles, their stored choice wins (see useHtmlPreference).
 * Kept in sync with the pre-paint script in index.html.
 */
function defaultTheme(): Theme {
  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useHtmlPreference<Theme>(
    'theme',
    'optima-analytics-platform-theme',
    THEMES,
    defaultTheme,
  )

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, toggleTheme }
}
