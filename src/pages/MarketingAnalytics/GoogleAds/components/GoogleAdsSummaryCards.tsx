import { Activity, BadgeDollarSign, Eye, MousePointerClick, Percent, ReceiptText, TrendingUp, Trophy } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import type { GoogleAdsInsights } from '@/data/googleAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas, formatSignedPercent } from '@/data/formatters'

const cards = [
  { key: 'spend', label: 'Ad Spend', icon: BadgeDollarSign, format: formatCompactCurrency },
  { key: 'impressions', label: 'Impressions', icon: Eye, format: formatCompactNumber },
  { key: 'clicks', label: 'Clicks', icon: MousePointerClick, format: formatCompactNumber },
  { key: 'ctr', label: 'CTR', icon: Percent, format: (value: number) => formatPercent(value, 2) },
  { key: 'conversions', label: 'Conversions', icon: Activity, format: formatCompactNumber },
  { key: 'cpa', label: 'CPA', icon: ReceiptText, format: formatCompactCurrency },
  { key: 'conversionValue', label: 'Conversion Value', icon: Trophy, format: formatCompactCurrency },
  { key: 'roas', label: 'ROAS', icon: TrendingUp, format: formatRoas },
] as const

export default function GoogleAdsSummaryCards({ data }: { data: GoogleAdsInsights }) {
  return (
    <section className="google-ads__summary" aria-label="Google Ads KPI summary">
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
