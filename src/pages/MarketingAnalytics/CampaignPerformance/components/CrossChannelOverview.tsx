import { BarChart3, PieChart } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CampaignPerformanceInsights, ChannelPerformance } from '@/data/campaignPerformanceSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas } from '@/data/formatters'

function ChannelRow({ row }: { row: ChannelPerformance }) {
  return (
    <article>
      <div>
        <strong>{row.label}</strong>
        <span>{formatCompactCurrency(row.spend)} spend · {formatCompactNumber(row.conversions)} conversions · ROAS {formatRoas(row.roas)}</span>
      </div>
      <span className="campaign-share"><i style={{ width: `${Math.max(2, row.spendShare * 100)}%` }} /><b style={{ width: `${Math.max(2, row.conversionShare * 100)}%` }} /></span>
      <small>Spend {formatPercent(row.spendShare)} · Conv {formatPercent(row.conversionShare)} · Gap {formatPercent(row.efficiencyGap)}</small>
    </article>
  )
}

export default function CrossChannelOverview({ data }: { data: CampaignPerformanceInsights }) {
  return (
    <section className="google-ads__grid google-ads__grid--two">
      <GlassCard interactive={false} className="google-panel campaign-channel-card">
        <SectionTitle icon={BarChart3} title="Cross-Channel Overview" subtitle="Weighted metric dari total numerator dan denominator" />
        <div className="campaign-channel-card__rows">
          {data.channels.map((row) => <ChannelRow key={row.id} row={row} />)}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="google-panel campaign-channel-card">
        <SectionTitle icon={PieChart} title="Channel Contribution" subtitle="Spend share dibanding contribution hasil" />
        <div className="campaign-contribution">
          {data.channels.map((row) => (
            <div key={row.id}>
              <strong>{row.label}</strong>
              <span><i style={{ width: `${row.spendShare * 100}%` }} />Spend {formatPercent(row.spendShare)}</span>
              <span><b style={{ width: `${row.returnShare * 100}%` }} />Return {formatPercent(row.returnShare)}</span>
              <small>CTR {formatPercent(row.ctr, 2)} · CPA {formatCompactCurrency(row.cpa)} · CAC {formatCompactCurrency(row.cac)}</small>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
