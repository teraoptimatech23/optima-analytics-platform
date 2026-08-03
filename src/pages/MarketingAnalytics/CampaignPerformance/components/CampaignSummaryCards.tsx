import { Activity, BadgeDollarSign, Eye, MousePointerClick, ReceiptText, Target, TrendingUp, Trophy, UserPlus, UsersRound } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import type { CampaignPerformanceInsights } from '@/data/campaignPerformanceSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas, formatSignedPercent } from '@/data/formatters'

const cards = [
  { key: 'spend', label: 'Total Marketing Spend', icon: BadgeDollarSign, format: formatCompactCurrency },
  { key: 'impressions', label: 'Total Impressions', icon: Eye, format: formatCompactNumber },
  { key: 'clicks', label: 'Total Clicks', icon: MousePointerClick, format: formatCompactNumber },
  { key: 'conversions', label: 'Total Conversions', icon: Activity, format: formatCompactNumber },
  { key: 'ctr', label: 'Blended CTR', icon: TrendingUp, format: (value: number) => formatPercent(value, 2) },
  { key: 'cpa', label: 'Blended CPA', icon: ReceiptText, format: formatCompactCurrency },
  { key: 'conversionValue', label: 'Conversion Value', icon: Trophy, format: formatCompactCurrency },
  { key: 'roas', label: 'Blended ROAS', icon: Target, format: formatRoas },
  { key: 'newCustomers', label: 'New Customers', icon: UserPlus, format: formatCompactNumber },
  { key: 'cac', label: 'Blended CAC', icon: UsersRound, format: formatCompactCurrency },
] as const

export default function CampaignSummaryCards({ data }: { data: CampaignPerformanceInsights }) {
  return (
    <section className="google-ads__summary" aria-label="Campaign Performance KPI summary">
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
