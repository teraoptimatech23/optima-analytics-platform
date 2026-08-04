import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react'
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
import { useAuthStore } from '@/store/useAuthStore'
import './Sidebar.less'

type ProfileMenuPlacement = 'expanded' | 'collapsed' | 'mobile'

type ProfileMenuPosition = {
  left: number
  top: number
  width: number
  placement: ProfileMenuPlacement
}

const profileActions = [
  { id: 'profile', label: 'My Profile', icon: UserRound },
  { id: 'settings', label: 'Account Settings', icon: Settings },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

const PROFILE_MENU_ESTIMATED_HEIGHT = 214
const PROFILE_MENU_COLLAPSED_WIDTH = 224
const PROFILE_MENU_MARGIN = 12

export default function Sidebar() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const expandedSidebarSections = useAppStore((state) => state.expandedSidebarSections)
  const setMobileSidebarOpen = useAppStore((state) => state.setMobileSidebarOpen)
  const toggleSidebarSection = useAppStore((state) => state.toggleSidebarSection)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileMenuPosition, setProfileMenuPosition] = useState<ProfileMenuPosition | null>(null)
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)
  const [profileToast, setProfileToast] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const profileMenuOpenRef = useRef(profileMenuOpen)
  const signOutDialogOpenRef = useRef(signOutDialogOpen)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const activeItems = useMemo(
    () => flattenSidebarItems().filter((item) => isMenuActive(location.pathname, item.path)),
    [location.pathname],
  )

  if (import.meta.env.DEV && activeItems.length > 1) {
    console.warn('Multiple active sidebar items detected:', activeItems.map((item) => item.path))
  }

  useEffect(() => {
    profileMenuOpenRef.current = profileMenuOpen
  }, [profileMenuOpen])

  useEffect(() => {
    signOutDialogOpenRef.current = signOutDialogOpen
  }, [signOutDialogOpen])

  const updateProfileMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (viewportWidth <= 640) {
      setProfileMenuPosition({
        left: PROFILE_MENU_MARGIN,
        top: Math.max(PROFILE_MENU_MARGIN, viewportHeight - PROFILE_MENU_ESTIMATED_HEIGHT - PROFILE_MENU_MARGIN),
        width: Math.max(280, viewportWidth - PROFILE_MENU_MARGIN * 2),
        placement: 'mobile',
      })
      return
    }

    if (sidebarCollapsed) {
      const width = PROFILE_MENU_COLLAPSED_WIDTH
      const left = Math.min(rect.right + 10, viewportWidth - width - PROFILE_MENU_MARGIN)
      const top = Math.min(
        Math.max(rect.top, PROFILE_MENU_MARGIN),
        viewportHeight - PROFILE_MENU_ESTIMATED_HEIGHT - PROFILE_MENU_MARGIN,
      )

      setProfileMenuPosition({ left, top, width, placement: 'collapsed' })
      return
    }

    const width = Math.max(rect.width, 224)
    const left = Math.min(Math.max(rect.left, PROFILE_MENU_MARGIN), viewportWidth - width - PROFILE_MENU_MARGIN)
    const topAbove = rect.top - PROFILE_MENU_ESTIMATED_HEIGHT - 10
    const top = topAbove >= PROFILE_MENU_MARGIN ? topAbove : rect.bottom + 10

    setProfileMenuPosition({ left, top, width, placement: 'expanded' })
  }, [sidebarCollapsed])

  const closeProfileMenu = useCallback((restoreFocus = false) => {
    setProfileMenuOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
  }, [])

  useEffect(() => {
    if (!profileMenuOpen) return undefined

    updateProfileMenuPosition()
    const handleGeometryChange = () => updateProfileMenuPosition()

    window.addEventListener('resize', handleGeometryChange)
    window.addEventListener('scroll', handleGeometryChange, true)
    return () => {
      window.removeEventListener('resize', handleGeometryChange)
      window.removeEventListener('scroll', handleGeometryChange, true)
    }
  }, [profileMenuOpen, updateProfileMenuPosition])

  useEffect(() => {
    if (!profileMenuOpen) return undefined

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      closeProfileMenu(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer, true)
    window.addEventListener('pointerdown', closeOnOutsidePointer, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true)
      window.removeEventListener('pointerdown', closeOnOutsidePointer, true)
    }
  }, [closeProfileMenu, profileMenuOpen])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || (!profileMenuOpenRef.current && !signOutDialogOpenRef.current)) return
      event.preventDefault()
      if (signOutDialogOpenRef.current) {
        setSignOutDialogOpen(false)
      }
      closeProfileMenu(true)
    }

    document.addEventListener('keydown', closeOnEscape, true)
    window.addEventListener('keydown', closeOnEscape, true)
    return () => {
      document.removeEventListener('keydown', closeOnEscape, true)
      window.removeEventListener('keydown', closeOnEscape, true)
    }
  }, [closeProfileMenu])

  useEffect(() => {
    if (!profileToast) return undefined
    const timer = window.setTimeout(() => setProfileToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [profileToast])

  useEffect(() => {
    if (signOutDialogOpen) {
      cancelButtonRef.current?.focus()
    }
  }, [signOutDialogOpen])

  useEffect(() => {
    if (!profileMenuOpen || !profileMenuPosition) return undefined
    const frame = window.requestAnimationFrame(() => {
      menuRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [profileMenuOpen, profileMenuPosition])

  // Desktop panel and mobile drawer are two live copies; scope the highlight.
  const indicatorId = useId()
  const menuId = `${indicatorId}-profile-menu`
  const dialogTitleId = `${indicatorId}-sign-out-title`
  const dialogDescriptionId = `${indicatorId}-sign-out-description`
  const portalTarget = typeof document === 'undefined' ? null : document.body

  const showComingSoon = (label: string) => {
    setProfileToast(`${label} Coming Soon`)
    closeProfileMenu(true)
  }

  const openSignOutDialog = () => {
    closeProfileMenu(false)
    setSignOutDialogOpen(true)
  }

  const handleProfileMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const menuItems = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
    const currentIndex = menuItems.findIndex((item) => item === document.activeElement)

    if (event.key === 'Escape') {
      event.preventDefault()
      closeProfileMenu(true)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      menuItems[(currentIndex + 1 + menuItems.length) % menuItems.length]?.focus()
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      menuItems[(currentIndex - 1 + menuItems.length) % menuItems.length]?.focus()
    }
  }

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
    if (!focusable?.length) return

    const first = focusable.item(0)
    const last = focusable.item(focusable.length - 1)

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const handleSignOut = () => {
    logout()
    setSignOutDialogOpen(false)
    closeProfileMenu(false)
    setMobileSidebarOpen(false)
    navigate('/login', { replace: true })
  }

  const profileMenuStyle = profileMenuPosition
    ? ({
        '--profile-menu-left': `${profileMenuPosition.left}px`,
        '--profile-menu-top': `${profileMenuPosition.top}px`,
        '--profile-menu-width': `${profileMenuPosition.width}px`,
      } as CSSProperties)
    : undefined

  const profileMenu = portalTarget
    ? createPortal(
        <AnimatePresence>
          {profileMenuOpen && profileMenuPosition && (
            <motion.div
              className={clsx('sidebar__profile-menu', `sidebar__profile-menu--${profileMenuPosition.placement}`)}
              id={menuId}
              ref={menuRef}
              role="menu"
              aria-label="Profile menu"
              tabIndex={-1}
              style={profileMenuStyle}
              onKeyDown={handleProfileMenuKeyDown}
              initial={reduceMotion ? false : { opacity: 0, y: profileMenuPosition.placement === 'expanded' ? 8 : 0, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {profileActions.map(({ id, label, icon: Icon }) => (
                <button className="sidebar__profile-action" type="button" role="menuitem" key={id} onClick={() => showComingSoon(label)}>
                  <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
              <span className="sidebar__profile-separator" aria-hidden="true" />
              <button className="sidebar__profile-action sidebar__profile-action--danger" type="button" role="menuitem" onClick={openSignOutDialog}>
                <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        portalTarget,
      )
    : null

  const signOutDialog = portalTarget
    ? createPortal(
        <AnimatePresence>
          {signOutDialogOpen && (
            <motion.div
              className="sidebar__dialog-backdrop"
              role="presentation"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                className="sidebar__dialog"
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                aria-describedby={dialogDescriptionId}
                tabIndex={-1}
                onKeyDown={handleDialogKeyDown}
                initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="sidebar__dialog-icon" aria-hidden="true">
                  <LogOut size={20} strokeWidth={1.9} />
                </div>
                <div className="sidebar__dialog-copy">
                  <h2 id={dialogTitleId}>Sign Out</h2>
                  <p id={dialogDescriptionId}>Are you sure you want to sign out from Optima Analytics Platform?</p>
                </div>
                <div className="sidebar__dialog-actions">
                  <button className="sidebar__dialog-button" type="button" ref={cancelButtonRef} onClick={() => setSignOutDialogOpen(false)}>
                    Cancel
                  </button>
                  <button className="sidebar__dialog-button sidebar__dialog-button--danger" type="button" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        portalTarget,
      )
    : null

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

      <div className="sidebar__profile">
        <button
          className={clsx('sidebar__user', profileMenuOpen && 'sidebar__user--open')}
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={profileMenuOpen}
          aria-controls={profileMenuOpen ? menuId : undefined}
          title={sidebarCollapsed ? 'Andi Wijaya - Marketing Manager' : undefined}
          onClick={() => {
            setProfileMenuOpen((open) => {
              const nextOpen = !open
              if (nextOpen) {
                window.requestAnimationFrame(updateProfileMenuPosition)
              }
              return nextOpen
            })
          }}
        >
          <span className="sidebar__avatar">
            <Avatar initials="AW" tone="blue" />
            <span className="sidebar__status" aria-hidden="true" />
          </span>
          <div className="sidebar__user-copy">
            <strong>Andi Wijaya</strong>
            <span>Marketing Manager</span>
          </div>
          <ChevronDown size={16} aria-hidden="true" />
        </button>

        <AnimatePresence>
          {profileToast && (
            <motion.div
              className="sidebar__profile-toast"
              role="status"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.16 }}
            >
              {profileToast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {profileMenu}
      {signOutDialog}
    </aside>
  )
}
