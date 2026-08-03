import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import Sidebar from '@/components/layout/Sidebar/Sidebar'
import Topbar from '@/components/layout/Topbar/Topbar'
import PageTransition from '@/components/layout/PageTransition'
import { useAppStore } from '@/store/useAppStore'
import './DashboardLayout.less'

export default function DashboardLayout() {
  const collapsed = useAppStore((state) => state.sidebarCollapsed)
  const mobileSidebarOpen = useAppStore((state) => state.mobileSidebarOpen)
  const setMobileSidebarOpen = useAppStore((state) => state.setMobileSidebarOpen)
  const location = useLocation()

  return (
    <div className={clsx('dashboard-layout', collapsed && 'dashboard-layout--collapsed')}>
      <a className="skip-link" href="#konten-utama">
        Lewati ke konten utama
      </a>

      {/* Abstract liquid scenery — decorative only, sits behind every surface. */}
      <div className="dashboard-layout__scene" aria-hidden="true">
        <span className="liquid-blob dashboard-layout__blob dashboard-layout__blob--one" />
        <span className="liquid-blob dashboard-layout__blob dashboard-layout__blob--two" />
        <span className="liquid-blob dashboard-layout__blob dashboard-layout__blob--three" />
        <span className="liquid-ring dashboard-layout__ring" />
      </div>

      <Sidebar />

      <button
        className={clsx('dashboard-layout__scrim', mobileSidebarOpen && 'dashboard-layout__scrim--open')}
        type="button"
        aria-label="Tutup menu"
        onClick={() => setMobileSidebarOpen(false)}
      />
      <div className={clsx('dashboard-layout__mobile-drawer', mobileSidebarOpen && 'dashboard-layout__mobile-drawer--open')}>
        {mobileSidebarOpen && <Sidebar />}
      </div>

      <main className="dashboard-layout__main">
        <div className="dashboard-layout__scroller">
          <Topbar />
          <div className="dashboard-layout__inner" id="konten-utama" tabIndex={-1}>
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
