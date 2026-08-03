import { Filter, ScatterChart } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { GoogleAdsInsights } from '@/data/googleAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas } from '@/data/formatters'

export default function GoogleAdsFunnelMatrix({ data }: { data: GoogleAdsInsights }) {
  const maxConversion = Math.max(1, ...data.campaigns.map((row) => row.conversions))
  const maxSpend = Math.max(1, ...data.campaigns.map((row) => row.spend))
  const maxValue = Math.max(1, ...data.campaigns.map((row) => row.conversionValue))

  return (
    <section className="google-ads__grid google-ads__grid--two">
      <GlassCard interactive={false} className="google-panel google-funnel">
        <SectionTitle icon={Filter} title="Marketing Funnel" subtitle="Tahapan yang tersedia dari dataset" />
        <div className="google-funnel__steps">
          {data.funnel.map((step) => (
            <div className="google-funnel__step" key={step.stage}>
              <span>{step.stage}</span>
              <strong>{step.stage === 'Conversion Value' ? formatCompactCurrency(step.value) : formatCompactNumber(step.value)}</strong>
              <small>{step.rateFromPrevious === undefined ? 'Base volume' : step.stage === 'Conversion Value' ? `ROAS ${formatRoas(step.rateFromPrevious)}` : `${formatPercent(step.rateFromPrevious, 2)} dari tahap sebelumnya`}</small>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard interactive={false} className="google-panel google-matrix">
        <SectionTitle icon={ScatterChart} title="Campaign Quality Matrix" subtitle="X = spend, Y = conversion value, size = conversions" />
        <div className="google-matrix__plot" role="img" aria-label="Campaign quality matrix">
          <span className="google-matrix__axis google-matrix__axis--x" />
          <span className="google-matrix__axis google-matrix__axis--y" />
          {data.campaigns.map((campaign) => (
            <span
              className={`google-matrix__dot google-matrix__dot--${campaign.status}`}
              key={campaign.campaignId}
              style={{
                left: `${Math.max(4, (campaign.spend / maxSpend) * 88)}%`,
                bottom: `${Math.max(8, (campaign.conversionValue / maxValue) * 84)}%`,
                width: `${18 + (campaign.conversions / maxConversion) * 28}px`,
                height: `${18 + (campaign.conversions / maxConversion) * 28}px`,
              }}
              title={`${campaign.campaignName}: spend ${formatCompactCurrency(campaign.spend)}, conversions ${formatCompactNumber(campaign.conversions)}, ROAS ${formatRoas(campaign.roas)}`}
            />
          ))}
        </div>
        <div className="google-matrix__legend">
          <span>Scale</span><span>High Value but Expensive</span><span>Efficient Low Volume</span><span>Optimize or Pause</span>
        </div>
      </GlassCard>
    </section>
  )
}
