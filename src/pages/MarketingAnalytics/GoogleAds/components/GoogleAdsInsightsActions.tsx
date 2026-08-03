import { Lightbulb, ListChecks, Scale, WalletCards } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { GoogleAdsInsights } from '@/data/googleAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas, formatSignedPercent } from '@/data/formatters'

export default function GoogleAdsInsightsActions({ data }: { data: GoogleAdsInsights }) {
  const comparisonRows = [
    ['Spend', formatCompactCurrency(data.summary.spend), formatCompactCurrency(data.previousSummary.spend), data.deltas.spend],
    ['Impressions', formatCompactNumber(data.summary.impressions), formatCompactNumber(data.previousSummary.impressions), data.deltas.impressions],
    ['Clicks', formatCompactNumber(data.summary.clicks), formatCompactNumber(data.previousSummary.clicks), data.deltas.clicks],
    ['CTR', formatPercent(data.summary.ctr, 2), formatPercent(data.previousSummary.ctr, 2), data.deltas.ctr],
    ['CPC', formatCompactCurrency(data.summary.cpc), formatCompactCurrency(data.previousSummary.cpc), data.deltas.cpc],
    ['Conversions', formatCompactNumber(data.summary.conversions), formatCompactNumber(data.previousSummary.conversions), data.deltas.conversions],
    ['CPA', formatCompactCurrency(data.summary.cpa), formatCompactCurrency(data.previousSummary.cpa), data.deltas.cpa],
    ['Conversion Value', formatCompactCurrency(data.summary.conversionValue), formatCompactCurrency(data.previousSummary.conversionValue), data.deltas.conversionValue],
    ['ROAS', formatRoas(data.summary.roas), formatRoas(data.previousSummary.roas), data.deltas.roas],
  ] as const

  return (
    <>
      <section className="google-ads__grid google-ads__grid--two">
        <GlassCard interactive={false} className="google-panel google-cost">
          <SectionTitle icon={WalletCards} title="Cost Efficiency" subtitle="Current vs previous comparable period" />
          <div className="google-cost__tiles">
            <article><span>CPC</span><strong>{formatCompactCurrency(data.summary.cpc)}</strong><small>{formatSignedPercent(data.deltas.cpc ?? 0)}</small></article>
            <article><span>CPM</span><strong>{formatCompactCurrency(data.summary.cpm)}</strong><small>per 1.000 impressions</small></article>
            <article><span>CPA</span><strong>{formatCompactCurrency(data.summary.cpa)}</strong><small>{formatSignedPercent(data.deltas.cpa ?? 0)}</small></article>
            <article><span>CAC Proxy</span><strong>{formatCompactCurrency(data.summary.cac)}</strong><small>cost / conversions</small></article>
          </div>
        </GlassCard>

        <GlassCard interactive={false} className="google-panel google-comparison">
          <SectionTitle icon={Scale} title="Period Comparison" subtitle="Periode aktif vs periode sebelumnya dengan panjang sama" />
          <div className="google-comparison__rows">
            {comparisonRows.map(([label, current, previous, delta]) => (
              <article key={label}>
                <span>{label}</span><strong>{current}</strong><small>{previous}</small><em className={(delta ?? 0) >= 0 ? 'is-positive' : 'is-negative'}>{formatSignedPercent(delta ?? 0)}</em>
              </article>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="google-ads__grid google-ads__grid--two">
        <GlassCard interactive={false} className="google-panel google-insights">
          <SectionTitle icon={Lightbulb} title="Google Ads Insights" subtitle="Dihitung dari data aktif" />
          <ol>{data.insights.map((insight) => <li key={insight}>{insight}</li>)}</ol>
        </GlassCard>

        <GlassCard interactive={false} className="google-panel google-actions">
          <SectionTitle icon={ListChecks} title="Recommended Actions" subtitle="Rekomendasi berbasis aturan transparan" tone="orange" />
          <div className="google-actions__list">
            {data.recommendations.map((recommendation) => (
              <article key={`${recommendation.campaignId}-${recommendation.issue}`}>
                <strong>{recommendation.issue}</strong>
                <span>{recommendation.evidence}</span>
                <p>{recommendation.action}</p>
                <small className={`google-priority google-priority--${recommendation.priority}`}>{recommendation.priority} · {recommendation.impact}</small>
              </article>
            ))}
          </div>
        </GlassCard>
      </section>
    </>
  )
}
