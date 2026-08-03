import { useId } from 'react'
import clsx from 'clsx'
import './Sparkline.less'

export type SparklineTone = 'blue' | 'purple' | 'cyan' | 'orange' | 'green' | 'red'

const TONE_STOPS: Record<SparklineTone, [string, string]> = {
  blue: ['#4f8bff', '#2f73ff'],
  purple: ['#a884ff', '#7d55f5'],
  cyan: ['#5ad9ef', '#1aa6bf'],
  orange: ['#ffc078', '#ff9b3d'],
  green: ['#4fc79b', '#1c9b68'],
  red: ['#ff8b95', '#ef4e5b'],
}

const VIEW_WIDTH = 100
const VIEW_HEIGHT = 40
const PADDING = 4

interface SparklineProps {
  data: number[]
  tone?: SparklineTone
  /** Draws a soft gradient area beneath the curve. */
  area?: boolean
  strokeWidth?: number
  className?: string
}

/**
 * Builds a smooth cubic path through the points using Catmull-Rom control
 * points, so the curve flows instead of showing hard vertices.
 */
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  if (!first) return ''
  if (rest.length === 0) return `M ${first.x} ${first.y}`

  let path = `M ${first.x} ${first.y}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)] ?? first
    const current = points[index] ?? first
    const next = points[index + 1] ?? first
    const following = points[Math.min(points.length - 1, index + 2)] ?? next

    const control1X = current.x + (next.x - previous.x) / 6
    const control1Y = current.y + (next.y - previous.y) / 6
    const control2X = next.x - (following.x - current.x) / 6
    const control2Y = next.y - (following.y - current.y) / 6

    path += ` C ${control1X.toFixed(2)} ${control1Y.toFixed(2)}, ${control2X.toFixed(2)} ${control2Y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
  }

  return path
}

export default function Sparkline({
  data,
  tone = 'blue',
  area = false,
  strokeWidth = 2.4,
  className,
}: SparklineProps) {
  const gradientId = useId()
  const [from, to] = TONE_STOPS[tone]

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = data.length > 1 ? (VIEW_WIDTH - PADDING * 2) / (data.length - 1) : 0

  const points = data.map((value, index) => ({
    x: PADDING + index * step,
    y: VIEW_HEIGHT - PADDING - ((value - min) / span) * (VIEW_HEIGHT - PADDING * 2),
  }))

  const line = buildSmoothPath(points)
  const areaPath = `${line} L ${VIEW_WIDTH - PADDING} ${VIEW_HEIGHT} L ${PADDING} ${VIEW_HEIGHT} Z`

  return (
    <svg
      className={clsx('sparkline', className)}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={to} stopOpacity=".28" />
          <stop offset="100%" stopColor={to} stopOpacity="0" />
        </linearGradient>
      </defs>

      {area && <path d={areaPath} fill={`url(#${gradientId}-area)`} />}

      <path
        d={line}
        fill="none"
        stroke={`url(#${gradientId}-stroke)`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
