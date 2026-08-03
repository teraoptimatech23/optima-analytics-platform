import clsx from 'clsx'
import './Skeleton.less'

interface SkeletonProps {
  /** CSS width, e.g. "60%" or 120. Defaults to filling the row. */
  width?: string | number
  height?: number
  radius?: number
  className?: string
}

export default function Skeleton({ width = '100%', height = 12, radius = 6, className }: SkeletonProps) {
  return (
    <span
      className={clsx('skeleton', className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}
