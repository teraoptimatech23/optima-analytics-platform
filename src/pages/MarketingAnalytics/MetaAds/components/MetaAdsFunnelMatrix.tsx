import { Filter, ScatterChart } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MetaAdsInsights } from '@/data/metaAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent } from '@/data/formatters'

export default function MetaAdsFunnelMatrix({ data }: { data: MetaAdsInsights }) {
  const maxConversion = Math.max(1, ...data.campaigns.map((row) => row.conversions))
  const maxCpa = Math.max(1, ...data.campaigns.map((row) => row.cpa))
  const maxEngagement = Math.max(1, ...data.campaigns.map((row) => row.engagementRate))

  return (
    <section className="google-ads__grid google-ads__grid--two">
      <GlassCard interactive={false} className="google-panel google-funnel">
        <SectionTitle icon={Filter} title="Meta Ads Funnel" subtitle="Tahapan yang tersedia dari dataset" />
        <div className="google-funnel__steps">
          {data.funnel.map((step) => (
            <div className="google-funnel__step" key={step.stage}>
              <span>{step.stage}</span>
              <strong>{formatCompactNumber(step.value)}</strong>
              <small>{step.rateFromPrevious === undefined ? 'Base audience' : `${formatPercent(step.rateFromPrevious, 2)} dari tahap acuan`}</small>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard interactive={false} className="google-panel google-matrix">
        <SectionTitle icon={ScatterChart} title="Meta Ads Quality Matrix" subtitle="X = CPA, Y = engagement rate, size = conversions" />
        <div className="google-matrix__plot" role="img" aria-label="Meta Ads quality matrix">
          {data.campaigns.map((campaign) => (
            <span
              className={`google-matrix__dot google-matrix__dot--${campaign.status === 'scale' ? 'excellent' : campaign.status === 'efficient' ? 'efficient' : campaign.status === 'underperforming' ? 'underperforming' : 'monitor'}`}
              key={campaign.campaignId}
              style={{
                left: `${Math.max(4, (campaign.cpa / maxCpa) * 88)}%`,
                bottom: `${Math.max(8, (campaign.engagementRate / maxEngagement) * 84)}%`,
                width: `${18 + (campaign.conversions / maxConversion) * 28}px`,
                height: `${18 + (campaign.conversions / maxConversion) * 28}px`,
              }}
              title={`${campaign.campaignName}: CPA ${formatCompactCurrency(campaign.cpa)}, conversions ${formatCompactNumber(campaign.conversions)}, engagement rate ${formatPercent(campaign.engagementRate, 2)}`}
            />
          ))}
        </div>
        <div className="google-matrix__legend">
          <span>Scale</span><span>High Engagement Expensive</span><span>Efficient Low Volume</span><span>Optimize or Pause</span>
        </div>
      </GlassCard>
    </section>
  )
}
