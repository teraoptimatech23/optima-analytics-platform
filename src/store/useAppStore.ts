import { create } from 'zustand'

interface AppState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  expandedSidebarSections: Record<string, boolean>
  toggleSidebar: () => void
  toggleSidebarSection: (id: string) => void
  setMobileSidebarOpen: (value: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  expandedSidebarSections: {
    'customer-insights': true,
    'purchase-analytics': true,
    'marketing-analytics': false,
    'predictive-analytics': false,
  },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleSidebarSection: (id) =>
    set((state) => ({
      expandedSidebarSections: {
        ...state.expandedSidebarSections,
        [id]: !(state.expandedSidebarSections[id] ?? false),
      },
    })),
  setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
}))
