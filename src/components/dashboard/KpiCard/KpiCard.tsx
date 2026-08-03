import GlassCard from '@/components/common/GlassCard/GlassCard'
import Sparkline from '@/components/charts/Sparkline/Sparkline'
import type { SparklineTone } from '@/components/charts/Sparkline/Sparkline'
import type { KpiItem, Tone } from '@/data/types'
import './KpiCard.less'

type KpiCardProps = Omit<KpiItem, 'id'>

const SPARK_TONE: Record<Tone, SparklineTone> = {
  blue: 'blue',
  purple: 'purple',
  cyan: 'cyan',
  orange: 'orange',
}

export default function KpiCard({ title, value, change, direction, positive, tone, icon: Icon, trend }: KpiCardProps) {
  return (
    <GlassCard className={`kpi-card kpi-card--${tone}`} compact>
      {/* Tinted liquid pooling inside the glass, behind the readout. */}
      <span className="kpi-card__glow" aria-hidden="true" />

      <span className="kpi-card__icon">
        <Icon size={20} strokeWidth={2} />
      </span>

      <div className="kpi-card__content">
        <span className="kpi-card__title">{title}</span>
        <strong className="kpi-card__value">{value}</strong>
        <small className={`kpi-card__change ${positive ? '' : 'kpi-card__change--down'}`}>
          <i className={`trend-arrow ${direction === 'down' ? 'trend-arrow--down' : ''}`} aria-hidden="true" />
          {change} vs Kuartal Lalu
        </small>
      </div>

      {trend.length > 1 && (
        <div className="kpi-card__spark">
          <Sparkline data={trend} tone={SPARK_TONE[tone]} area />
        </div>
      )}
    </GlassCard>
  )
}
