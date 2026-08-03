import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import './StateMessage.less'

interface StateMessageProps {
  icon: LucideIcon
  title: string
  description: string
  tone?: 'neutral' | 'danger'
  /** Optional recovery action, e.g. a retry button. */
  action?: ReactNode
  className?: string
}

/** Shared shell for empty and error states so both read the same. */
export default function StateMessage({
  icon: Icon,
  title,
  description,
  tone = 'neutral',
  action,
  className,
}: StateMessageProps) {
  return (
    <GlassCard
      className={clsx('state-message', `state-message--${tone}`, className)}
      interactive={false}
      role={tone === 'danger' ? 'alert' : undefined}
    >
      <span className="state-message__icon">
        <Icon size={22} strokeWidth={1.9} />
      </span>
      <strong className="state-message__title">{title}</strong>
      <p className="state-message__description">{description}</p>
      {action && <div className="state-message__action">{action}</div>}
    </GlassCard>
  )
}
