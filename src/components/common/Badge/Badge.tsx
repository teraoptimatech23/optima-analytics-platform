import type { ReactNode } from 'react'
import clsx from 'clsx'
import './Badge.less'

interface BadgeProps {
  children: ReactNode
  tone?: 'blue' | 'purple' | 'cyan' | 'orange' | 'red' | 'green' | 'neutral'
  className?: string
}

export default function Badge({ children, tone = 'blue', className }: BadgeProps) {
  return <span className={clsx('badge', `badge--${tone}`, className)}>{children}</span>
}
