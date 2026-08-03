import { create } from 'zustand'
import type { AppliedFilters } from '@/data/types'

export type FilterKey = keyof AppliedFilters
export type DashboardFilters = AppliedFilters

/**
 * Filters are dimension keys, not display strings: the query layer resolves
 * them against the cube, so every KPI re-aggregates from the same rows.
 * `null` means "no restriction on this dimension".
 */
const initialFilters: DashboardFilters = {
  quarter: '2026-Q2',
  region: null,
  city: null,
  outlet: null,
  gender: null,
  ageBand: null,
}

interface FilterState {
  filters: DashboardFilters
  setFilter: (key: FilterKey, value: string | null) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: initialFilters,
  setFilter: (key, value) =>
    set((state) => {
      const next = { ...state.filters, [key]: value }
      // Narrowing the geography clears the narrower keys below it, otherwise a
      // stale outlet would silently empty the slice.
      if (key === 'region') {
        next.city = null
        next.outlet = null
      }
      if (key === 'city') next.outlet = null
      return { filters: next }
    }),
  resetFilters: () => set({ filters: initialFilters }),
}))
