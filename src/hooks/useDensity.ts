import { useCallback } from 'react'
import { useHtmlPreference } from '@/hooks/useHtmlPreference'

export type Density = 'comfortable' | 'compact'

const DENSITIES = ['comfortable', 'compact'] as const

export function useDensity() {
  const [density, setDensity] = useHtmlPreference<Density>(
    'density',
    'optima-analytics-platform-density',
    DENSITIES,
    () => 'comfortable',
  )

  const toggleDensity = useCallback(() => {
    setDensity((current) => (current === 'compact' ? 'comfortable' : 'compact'))
  }, [setDensity])

  return { density, toggleDensity }
}
