import {
  AlignVerticalSpaceAround,
  AlignVerticalSpaceBetween,
  Bell,
  Menu,
  Moon,
  PanelLeft,
  PanelLeftClose,
  RefreshCcw,
  Share2,
  Sun,
} from 'lucide-react'
import Button from '@/components/common/Button/Button'
import FilterBar from '@/components/layout/FilterBar/FilterBar'
import { useDensity } from '@/hooks/useDensity'
import { useTheme } from '@/hooks/useTheme'
import { useAppStore } from '@/store/useAppStore'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './Topbar.less'

export default function Topbar() {
  const filterValues = useFilterStore((state) => state.filters)
  const setFilter = useFilterStore((state) => state.setFilter)
  const setMobileSidebarOpen = useAppStore((state) => state.setMobileSidebarOpen)
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const { theme, toggleTheme } = useTheme()
  const { density, toggleDensity } = useDensity()
  const loading = useDashboardStore((state) => state.loading)
  const cube = useDashboardStore((state) => state.cube)
  return (
    <header className="topbar">
      <div className="topbar__bar">
        {/* Tinted liquid drifting inside the header pane. */}
        <span className="topbar__glow" aria-hidden="true" />

        <button className="topbar__mobile-menu" onClick={() => setMobileSidebarOpen(true)} aria-label="Buka menu" type="button">
          <Menu size={19} />
        </button>

        <button
          className="topbar__icon-button topbar__collapse"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
          type="button"
        >
          {sidebarCollapsed ? <PanelLeft size={17} strokeWidth={1.9} /> : <PanelLeftClose size={17} strokeWidth={1.9} />}
        </button>

        <FilterBar values={filterValues} onChange={setFilter} cube={cube} />

        <div className="topbar__actions">
          <div className="topbar__updated">
            <span>Diperbarui terakhir:</span>
            <strong>15 Jun 2026 09.30 WIB</strong>
          </div>

          <button
            className="topbar__icon-button topbar__density"
            type="button"
            onClick={toggleDensity}
            aria-label={density === 'compact' ? 'Gunakan tampilan lega' : 'Gunakan tampilan rapat'}
            aria-pressed={density === 'compact'}
          >
            {density === 'compact'
              ? <AlignVerticalSpaceAround size={17} strokeWidth={1.9} />
              : <AlignVerticalSpaceBetween size={17} strokeWidth={1.9} />}
          </button>

          <button
            className="topbar__icon-button"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
          </button>

          <button
            className="topbar__icon-button"
            type="button"
            aria-label="Muat ulang data"
            aria-busy={loading}
            disabled={loading}
          >
            <RefreshCcw size={17} strokeWidth={1.9} />
          </button>

          <button className="topbar__icon-button topbar__icon-button--alert" type="button" aria-label="Notifikasi, 3 belum dibaca">
            <Bell size={17} strokeWidth={1.9} />
            <span className="topbar__badge">3</span>
          </button>

          <Button className="topbar__share" variant="glass" aria-label="Bagikan laporan">
            <Share2 size={16} strokeWidth={1.9} />
            <span className="topbar__share-label">Bagikan Laporan</span>
          </Button>

        </div>
      </div>
    </header>
  )
}
