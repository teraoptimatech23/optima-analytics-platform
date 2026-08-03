import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import './SectionTitle.less'

export type SectionTone = 'blue' | 'purple' | 'cyan' | 'orange' | 'red'

interface SectionTitleProps {
  icon?: LucideIcon
  title: string
  /** Muted text rendered inline next to the title, e.g. "(Importance vs Performance)". */
  subtitle?: string
  /** Node pushed to the far right of the header, e.g. a total or a badge. */
  meta?: ReactNode
  tone?: SectionTone
}

export default function SectionTitle({ icon: Icon, title, subtitle, meta, tone = 'blue' }: SectionTitleProps) {
  return (
    <header className={clsx('section-title', `section-title--${tone}`)}>
      <div className="section-title__main">
        {Icon && (
          <span className="section-title__icon">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
        <strong>{title}</strong>
        {subtitle && <span className="section-title__subtitle">{subtitle}</span>}
      </div>
      {meta && <span className="section-title__meta">{meta}</span>}
    </header>
  )
}
