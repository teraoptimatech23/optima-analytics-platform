import type { MouseEventHandler } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import './SidebarItem.less'

interface SidebarItemProps {
  className?: string
  collapsed?: boolean
  end?: boolean
  icon: LucideIcon
  label: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
  to: string
  /** Scopes the sliding highlight so the drawer copy animates independently. */
  indicatorId: string
}

export default function SidebarItem({
  className,
  collapsed = false,
  end = false,
  icon: Icon,
  label,
  indicatorId,
  onClick,
  to,
  ...props
}: SidebarItemProps) {
  const reduceMotion = useReducedMotion()

  return (
    <NavLink
      className={({ isActive }) => clsx('sidebar-item', className, isActive && 'sidebar-item--active')}
      end={end}
      title={collapsed ? label : undefined}
      onClick={onClick}
      to={to}
      {...props}
    >
      {({ isActive }) => (
        <>
          {/* The blue pill is one shared element that glides to the active item. */}
          {isActive &&
            (reduceMotion ? (
              <span className="sidebar-item__indicator" />
            ) : (
              <motion.span
                className="sidebar-item__indicator"
                layoutId={`${indicatorId}-active`}
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              />
            ))}

          <Icon className="sidebar-item__icon" size={18} strokeWidth={1.9} />
          <span className="sidebar-item__label">{label}</span>
        </>
      )}
    </NavLink>
  )
}
