import { Activity, BadgeDollarSign, Eye, MousePointerClick, RadioTower, Repeat, Sparkles, TrendingUp, UsersRound, Video } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import type { MetaAdsInsights } from '@/data/metaAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatFrequency, formatPercent, formatSignedPercent } from '@/data/formatters'

const cards = [
  { key: 'spend', label: 'Ad Spend', icon: BadgeDollarSign, format: formatCompactCurrency },
  { key: 'reach', label: 'Reach', icon: RadioTower, format: formatCompactNumber },
  { key: 'impressions', label: 'Impressions', icon: Eye, format: formatCompactNumber },
  { key: 'frequency', label: 'Frequency', icon: Repeat, format: formatFrequency },
  { key: 'linkClicks', label: 'Link Clicks', icon: MousePointerClick, format: formatCompactNumber },
  { key: 'linkCtr', label: 'Link CTR', icon: TrendingUp, format: (value: number) => formatPercent(value, 2) },
  { key: 'engagementRate', label: 'Engagement Rate', icon: Sparkles, format: (value: number) => formatPercent(value, 2) },
  { key: 'videoViews', label: 'Video Views', icon: Video, format: formatCompactNumber },
  { key: 'conversions', label: 'Conversions', icon: Activity, format: formatCompactNumber },
  { key: 'cpa', label: 'CPA', icon: UsersRound, format: formatCompactCurrency },
] as const

export default function MetaAdsSummaryCards({ data }: { data: MetaAdsInsights }) {
  return (
    <section className="google-ads__summary" aria-label="Meta Ads KPI summary">
      {cards.map(({ key, label, icon: Icon, format }) => {
        const value = data.summary[key]
        const delta = data.deltas[key] ?? 0
        return (
          <GlassCard interactive={false} className="google-kpi" key={key}>
            <span className="google-kpi__icon"><Icon size={19} /></span>
            <span className="google-kpi__label">{label}</span>
            <strong title={String(Math.round(value).toLocaleString('id-ID'))}>{format(value)}</strong>
            <small className={delta >= 0 ? 'is-positive' : 'is-negative'}>{formatSignedPercent(delta)} vs periode sebelumnya</small>
          </GlassCard>
        )
      })}
    </section>
  )
}
