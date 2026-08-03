import { useId, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import Avatar from '@/components/common/Avatar/Avatar'
import SidebarItem from '@/components/layout/SidebarItem/SidebarItem'
import {
  flattenSidebarItems,
  isMenuActive,
  isSectionActive,
  isSidebarSection,
  sidebarItems,
} from '@/components/layout/Sidebar/sidebarItems'
import { useAppStore } from '@/store/useAppStore'
import './Sidebar.less'

export default function Sidebar() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const expandedSidebarSections = useAppStore((state) => state.expandedSidebarSections)
  const setMobileSidebarOpen = useAppStore((state) => state.setMobileSidebarOpen)
  const toggleSidebarSection = useAppStore((state) => state.toggleSidebarSection)
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const activeItems = useMemo(
    () => flattenSidebarItems().filter((item) => isMenuActive(location.pathname, item.path)),
    [location.pathname],
  )

  if (import.meta.env.DEV && activeItems.length > 1) {
    console.warn('Multiple active sidebar items detected:', activeItems.map((item) => item.path))
  }

  // Desktop panel and mobile drawer are two live copies; scope the highlight.
  const indicatorId = useId()

  return (
    <aside className={clsx('sidebar', sidebarCollapsed && 'sidebar--collapsed')}>
      {/* Liquid drifting inside the panel, behind the navigation. */}
      <span className="sidebar__glow sidebar__glow--top" aria-hidden="true" />
      <span className="sidebar__glow sidebar__glow--bottom" aria-hidden="true" />

      <div className="sidebar__brand">
        {/* One artwork for both themes: the mark ships on real transparency, so
            it needs no blend mode and no dark-mode variant. */}
        <span className="sidebar__logo-plate">
          <img className="sidebar__logo" src="/assets/optima-logo.png" alt="Optima Analytics Platform" />
        </span>
        <span className="sidebar__wordmark">
          <strong>OPTIMA</strong>
          <small>Analytics Platform</small>
        </span>
      </div>

      <nav className="sidebar__nav" aria-label="Navigasi utama">
        {sidebarItems.map((node) => {
          if (!isSidebarSection(node)) {
            return (
              <SidebarItem
                key={node.id}
                collapsed={sidebarCollapsed}
                end={node.path === '/'}
                icon={node.icon}
                indicatorId={indicatorId}
                label={node.label}
                to={node.path}
                onClick={() => {
                  setMobileSidebarOpen(false)
                }}
              />
            )
          }

          const active = isSectionActive(location.pathname, node)
          const expanded = active || (expandedSidebarSections[node.id] ?? false)
          const Icon = node.icon

          return (
            <section className={clsx('sidebar__section', active && 'sidebar__section--active')} key={node.id}>
              <button
                className="sidebar__section-toggle"
                type="button"
                title={sidebarCollapsed ? node.label : undefined}
                aria-expanded={expanded}
                aria-controls={`${indicatorId}-${node.id}`}
                onClick={() => toggleSidebarSection(node.id)}
              >
                <Icon className="sidebar__section-icon" size={18} strokeWidth={1.9} />
                <span className="sidebar__section-label">{node.label}</span>
                <ChevronDown className="sidebar__section-chevron" size={15} aria-hidden="true" />
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    className="sidebar__section-items"
                    id={`${indicatorId}-${node.id}`}
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {node.children.map(({ id, label, icon: ChildIcon, path }) => (
                      <SidebarItem
                        className="sidebar-item--nested"
                        key={id}
                        collapsed={sidebarCollapsed}
                        end={path === '/'}
                        icon={ChildIcon}
                        indicatorId={indicatorId}
                        label={label}
                        to={path}
                        onClick={() => {
                          setMobileSidebarOpen(false)
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )
        })}
      </nav>

      <div className="sidebar__user">
        <span className="sidebar__avatar">
          <Avatar initials="AW" tone="blue" />
          <span className="sidebar__status" aria-hidden="true" />
        </span>
        <div className="sidebar__user-copy">
          <strong>Andi Wijaya</strong>
          <span>Marketing Manager</span>
        </div>
        <ChevronDown size={16} />
      </div>
    </aside>
  )
}
