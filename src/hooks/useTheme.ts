import { useCallback } from 'react'
import { useHtmlPreference } from '@/hooks/useHtmlPreference'

export type Theme = 'light' | 'dark'

const THEMES = ['light', 'dark'] as const

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useHtmlPreference<Theme>(
    'theme',
    'optima-analytics-platform-theme',
    THEMES,
    systemTheme,
  )

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, toggleTheme }
}
