import './DonutChart.less'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSlice[]
  centerValue: string
  centerLabel: string
}

const SIZE = 100
const RADIUS = 40
const STROKE = 18
const GAP_DEGREES = 3

const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Hand-rolled so the dashboard doesn't pull a full charting library in for one
 * ring. Each slice is a stroked arc offset around the same circle.
 */
export default function DonutChart({ data, centerValue, centerLabel }: DonutChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1
  const gap = (GAP_DEGREES / 360) * CIRCUMFERENCE

  let offset = 0

  return (
    <div className="donut-chart">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${centerLabel}: ${centerValue}`}>
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {data.map((slice) => {
            const length = (slice.value / total) * CIRCUMFERENCE
            const dash = Math.max(0, length - gap)
            const circle = (
              <circle
                key={slice.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += length
            return circle
          })}
        </g>
      </svg>

      <div className="donut-chart__center">
        <strong>{centerValue}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  )
}
