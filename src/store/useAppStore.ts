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
    'digital-value-loop': true,
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
