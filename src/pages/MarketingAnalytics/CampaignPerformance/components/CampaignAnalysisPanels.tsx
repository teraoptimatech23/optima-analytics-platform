import { AlertTriangle, Filter, Lightbulb, ListChecks, Scale, ScatterChart, Target } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CampaignPerformanceInsights } from '@/data/campaignPerformanceSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas, formatSignedPercent } from '@/data/formatters'

export default function CampaignAnalysisPanels({ data }: { data: CampaignPerformanceInsights }) {
  const maxSpend = Math.max(1, ...data.campaigns.map((row) => row.spend))
  const maxValue = Math.max(1, ...data.campaigns.map((row) => row.conversionValue))
  const maxConversion = Math.max(1, ...data.campaigns.map((row) => row.conversions))
  const maxCpa = Math.max(1, ...data.campaigns.map((row) => row.cpa))
  const maxRoas = Math.max(1, ...data.campaigns.map((row) => row.roas))
  const comparisonRows = [
    ['Spend', formatCompactCurrency(data.summary.spend), formatCompactCurrency(data.previousSummary.spend), data.deltas.spend],
    ['Impressions', formatCompactNumber(data.summary.impressions), formatCompactNumber(data.previousSummary.impressions), data.deltas.impressions],
    ['Clicks', formatCompactNumber(data.summary.clicks), formatCompactNumber(data.previousSummary.clicks), data.deltas.clicks],
    ['CTR', formatPercent(data.summary.ctr, 2), formatPercent(data.previousSummary.ctr, 2), data.deltas.ctr],
    ['Conversions', formatCompactNumber(data.summary.conversions), formatCompactNumber(data.previousSummary.conversions), data.deltas.conversions],
    ['CPA', formatCompactCurrency(data.summary.cpa), formatCompactCurrency(data.previousSummary.cpa), data.deltas.cpa],
    ['Value', formatCompactCurrency(data.summary.conversionValue), formatCompactCurrency(data.previousSummary.conversionValue), data.deltas.conversionValue],
    ['ROAS', formatRoas(data.summary.roas), formatRoas(data.previousSummary.roas), data.deltas.roas],
  ] as const

  return (
    <>
      <section className="google-ads__grid google-ads__grid--two">
        <GlassCard interactive={false} className="google-panel google-matrix">
          <SectionTitle icon={ScatterChart} title="Spend vs Return Analysis" subtitle="X = spend, Y = conversion value, size = conversions" />
          <div className="google-matrix__plot" role="img" aria-label="Spend return scatter">
            {data.campaigns.map((campaign) => (
              <span
                className={`google-matrix__dot campaign-dot--${campaign.channel.toLowerCase().replace(/\s+/g, '-')}`}
                key={campaign.campaignId}
                style={{
                  left: `${Math.max(4, (campaign.spend / maxSpend) * 88)}%`,
                  bottom: `${Math.max(8, (campaign.conversionValue / maxValue) * 84)}%`,
                  width: `${18 + (campaign.conversions / maxConversion) * 28}px`,
                  height: `${18 + (campaign.conversions / maxConversion) * 28}px`,
                }}
                title={`${campaign.campaignName}: ${campaign.channel}, spend ${formatCompactCurrency(campaign.spend)}, value ${formatCompactCurrency(campaign.conversionValue)}, ROAS ${formatRoas(campaign.roas)}`}
              />
            ))}
          </div>
        </GlassCard>
        <GlassCard interactive={false} className="google-panel google-matrix">
          <SectionTitle icon={Target} title="Campaign Efficiency Matrix" subtitle="X = CPA, Y = ROAS, size = conversions" />
          <div className="google-matrix__plot" role="img" aria-label="Campaign efficiency matrix">
            {data.campaigns.map((campaign) => (
              <span
                className={`google-matrix__dot google-matrix__dot--${campaign.status === 'excellent' ? 'excellent' : campaign.status === 'strong' ? 'efficient' : campaign.status === 'underperforming' ? 'underperforming' : 'monitor'}`}
                key={campaign.campaignId}
                style={{
                  left: `${Math.max(4, (campaign.cpa / maxCpa) * 88)}%`,
                  bottom: `${Math.max(8, (campaign.roas / maxRoas) * 84)}%`,
                  width: `${18 + (campaign.conversions / maxConversion) * 28}px`,
                  height: `${18 + (campaign.conversions / maxConversion) * 28}px`,
                }}
                title={`${campaign.campaignName}: CPA ${formatCompactCurrency(campaign.cpa)}, ROAS ${formatRoas(campaign.roas)}`}
              />
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="google-ads__grid google-ads__grid--two">
        <GlassCard interactive={false} className="google-panel campaign-objectives">
          <SectionTitle icon={Scale} title="Objective Performance" subtitle="Score objective-aware, bukan satu formula untuk semua" />
          {data.objectives.map((row) => (
            <article key={row.objective}>
              <strong>{row.objective}</strong>
              <span>{row.primaryMetric}: {formatCompactNumber(row.primaryValue)} · Score {Math.round(row.performanceScore)}</span>
              <small>{Object.entries(row.secondaryMetrics).map(([key, value]) => `${key}: ${key.includes('roas') ? formatRoas(value) : key.includes('cpa') || key.includes('cpm') ? formatCompactCurrency(value) : formatPercent(value, 2)}`).join(' · ')}</small>
            </article>
          ))}
        </GlassCard>
        <GlassCard interactive={false} className="google-panel campaign-funnel">
          <SectionTitle icon={Filter} title="Funnel Comparison" subtitle="Tahap universal: impressions, clicks, conversions, value" />
          <div className="campaign-funnel__grid">
            {data.funnel.map((step) => (
              <article key={`${step.channel}-${step.stage}`}>
                <span>{step.channel}</span>
                <strong>{step.stage === 'Conversion Value' ? formatCompactCurrency(step.value) : formatCompactNumber(step.value)}</strong>
                <small>{step.stage}{step.rateFromPrevious === undefined ? '' : ` · ${step.stage === 'Conversion Value' ? formatRoas(step.rateFromPrevious) : formatPercent(step.rateFromPrevious, 2)}`}</small>
              </article>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="google-ads__grid google-ads__grid--two">
        <GlassCard interactive={false} className="google-panel campaign-objectives">
          <SectionTitle icon={Lightbulb} title="Top Performers" subtitle="Campaign dengan score tertinggi" />
          {data.winners.map((campaign) => (
            <article key={campaign.campaignId}><strong>{campaign.campaignName}</strong><span>{campaign.channel} · Score {Math.round(campaign.campaignScore)} · {formatCompactNumber(campaign.conversions)} conversions</span><small>{campaign.trendStatus}</small></article>
          ))}
        </GlassCard>
        <GlassCard interactive={false} className="google-panel campaign-objectives">
          <SectionTitle icon={AlertTriangle} title="Needs Attention" subtitle="Campaign dengan score terendah" tone="orange" />
          {data.needsAttention.map((campaign) => (
            <article key={campaign.campaignId}><strong>{campaign.campaignName}</strong><span>{campaign.channel} · Score {Math.round(campaign.campaignScore)} · CPA {formatCompactCurrency(campaign.cpa)}</span><small>{campaign.status} · {campaign.trendStatus}</small></article>
          ))}
        </GlassCard>
      </section>

      <section className="google-ads__grid google-ads__grid--two">
        <GlassCard interactive={false} className="google-panel google-comparison">
          <SectionTitle icon={Scale} title="Period Comparison" subtitle="Current period vs previous comparable period" />
          <div className="google-comparison__rows">
            {comparisonRows.map(([label, current, previous, delta]) => (
              <article key={label}><span>{label}</span><strong>{current}</strong><small>{previous}</small><em className={(delta ?? 0) >= 0 ? 'is-positive' : 'is-negative'}>{formatSignedPercent(delta ?? 0)}</em></article>
            ))}
          </div>
        </GlassCard>
        <GlassCard interactive={false} className="google-panel google-insights">
          <SectionTitle icon={Lightbulb} title="Campaign Performance Insights" subtitle="Dihitung dari unified selector" />
          <ol>{data.insights.map((insight) => <li key={insight}>{insight}</li>)}</ol>
        </GlassCard>
      </section>

      <section className="google-ads__grid google-ads__grid--two">
        <GlassCard interactive={false} className="google-panel google-actions">
          <SectionTitle icon={ListChecks} title="Recommended Actions" subtitle="Berbasis data, tanpa proyeksi ROI" tone="orange" />
          <div className="google-actions__list">
            {data.recommendations.map((recommendation) => (
              <article key={`${recommendation.campaignId}-${recommendation.channel}-${recommendation.issue}`}>
                <strong>{recommendation.issue}</strong>
                <span>{recommendation.evidence}</span>
                <p>{recommendation.action}</p>
                <small className={`google-priority google-priority--${recommendation.priority}`}>{recommendation.priority} · {recommendation.impact}</small>
              </article>
            ))}
          </div>
        </GlassCard>
        <GlassCard interactive={false} className="google-panel google-insights">
          <SectionTitle icon={AlertTriangle} title="Attribution Notes" subtitle="Batas interpretasi lintas platform" tone="orange" />
          <ol><li>{data.attributionNote}</li><li>Blended metric memakai total numerator dan denominator, bukan average campaign metric.</li></ol>
        </GlassCard>
      </section>
    </>
  )
}
