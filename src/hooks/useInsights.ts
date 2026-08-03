import { useEffect, useRef } from 'react'
import { loadCube } from '@/data/cube'
import { buildSnapshot } from '@/data/query'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'

/**
 * Re-querying the cube takes ~20 ms, which is too fast to notice. A short hold
 * on the skeleton makes the change legible: the user sees the dashboard rebuild
 * rather than numbers silently mutating under them.
 */
const REQUERY_HOLD_MS = 420

/**
 * Loads the aggregate cube once, then re-queries it whenever the filters
 * change. The cube stays in the store so switching filters is a pure
 * recomputation — no refetch.
 */
export function useInsights() {
  const cube = useDashboardStore((state) => state.cube)
  const setCube = useDashboardStore((state) => state.setCube)
  const setData = useDashboardStore((state) => state.setData)
  const setLoading = useDashboardStore((state) => state.setLoading)
  const setError = useDashboardStore((state) => state.setError)
  const filters = useFilterStore((state) => state.filters)

  useEffect(() => {
    if (cube) return
    let cancelled = false
    setLoading(true)
    loadCube()
      .then((loaded) => {
        if (cancelled) return
        setCube(loaded)
        setError(null)
        // Cleared here, not in `finally`: setting the cube re-runs this effect,
        // and its cleanup would flip `cancelled` before finally ever fired —
        // leaving the skeleton up forever.
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : 'Gagal memuat data insight.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cube, setCube, setError, setLoading])

  const firstQuery = useRef(true)

  useEffect(() => {
    if (!cube) return

    // The first snapshot lands as soon as the cube arrives — the loading state
    // for that is already owned by the fetch above.
    if (firstQuery.current) {
      firstQuery.current = false
      setData(buildSnapshot(cube, filters))
      return
    }

    setLoading(true)
    const timer = window.setTimeout(() => {
      setData(buildSnapshot(cube, filters))
      setLoading(false)
    }, REQUERY_HOLD_MS)

    return () => window.clearTimeout(timer)
  }, [cube, filters, setData, setLoading])
}
