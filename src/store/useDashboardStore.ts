import { create } from 'zustand'
import type { InsightCube, InsightSnapshot } from '@/data/types'

interface DashboardState {
  /** The loaded cube; kept so filter changes re-query without re-fetching. */
  cube: InsightCube | null
  data: InsightSnapshot | null
  loading: boolean
  error: string | null
  setCube: (cube: InsightCube) => void
  setData: (data: InsightSnapshot) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  cube: null,
  data: null,
  loading: true,
  error: null,
  setCube: (cube) => set({ cube }),
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
