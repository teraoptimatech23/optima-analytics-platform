import clsx from 'clsx'
import './ProgressBar.less'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  tone?: 'blue' | 'purple' | 'cyan' | 'orange' | 'green' | 'red'
  size?: 'sm' | 'md'
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'blue',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      className={clsx('progress', `progress--${tone}`, size === 'sm' && 'progress--sm', className)}
      aria-label={label}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span className="progress__fill" style={{ width: `${percentage}%` }} />
    </div>
  )
}
