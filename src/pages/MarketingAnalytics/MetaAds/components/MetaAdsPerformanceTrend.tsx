import type { Dispatch, SetStateAction } from 'react'
import { LineChart } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MetaAdsInsights, MetaAdsLocalFilters, MetaMetricKey } from '@/data/metaAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatFrequency, formatPercent } from '@/data/formatters'

const metricOptions: [MetaMetricKey, string][] = [
  ['spend', 'Spend'], ['reach', 'Reach'], ['impressions', 'Impressions'], ['frequency', 'Frequency'],
  ['linkClicks', 'Link Clicks'], ['linkCtr', 'Link CTR'], ['engagement', 'Engagement'],
  ['engagementRate', 'Engagement Rate'], ['conversions', 'Conversions'], ['cpa', 'CPA'], ['videoViews', 'Video Views'],
]

const formatMetric = (metric: MetaMetricKey, value: number) => {
  if (metric === 'spend' || metric === 'cpa') return formatCompactCurrency(value)
  if (metric === 'linkCtr' || metric === 'engagementRate') return formatPercent(value, 2)
  if (metric === 'frequency') return formatFrequency(value)
  return formatCompactNumber(value)
}

export default function MetaAdsPerformanceTrend({
  data,
  localFilters,
  setLocalFilters,
}: {
  data: MetaAdsInsights
  localFilters: MetaAdsLocalFilters
  setLocalFilters: Dispatch<SetStateAction<MetaAdsLocalFilters>>
}) {
  const values = data.trends.map((row) => row[localFilters.metric])
  const max = Math.max(1, ...values)

  return (
    <GlassCard interactive={false} className="google-panel google-trend">
      <div className="google-panel__head">
        <SectionTitle icon={LineChart} title="Performance Overview" subtitle="Trend Meta Ads berdasarkan aggregate bulanan" />
        <div className="google-controls" aria-label="Filter lokal Meta Ads">
          <select aria-label="Metric trend" value={localFilters.metric} onChange={(event) => setLocalFilters((state) => ({ ...state, metric: event.target.value as MetaMetricKey }))}>
            {metricOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Granularity" value={localFilters.granularity} onChange={(event) => setLocalFilters((state) => ({ ...state, granularity: event.target.value as MetaAdsLocalFilters['granularity'] }))}>
            <option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="daily">Daily</option>
          </select>
          <select aria-label="Objective" value={localFilters.objective} onChange={(event) => setLocalFilters((state) => ({ ...state, objective: event.target.value }))}>
            <option value="all">Semua Objective</option>
            {data.availableObjectives.map((objective) => <option key={objective} value={objective}>{objective}</option>)}
          </select>
          <select aria-label="Campaign" value={localFilters.campaignId} onChange={(event) => setLocalFilters((state) => ({ ...state, campaignId: event.target.value }))}>
            <option value="all">Semua Campaign</option>
            {data.availableCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          <select aria-label="Audience dimension" value={localFilters.audienceDimension} onChange={(event) => setLocalFilters((state) => ({ ...state, audienceDimension: event.target.value as MetaAdsLocalFilters['audienceDimension'] }))}>
            <option value="age">Audience: Age</option><option value="gender">Audience: Gender</option><option value="location">Audience: Location</option>
          </select>
        </div>
      </div>
      <div className="google-trend__chart" role="img" aria-label={`Trend ${localFilters.metric}`}>
        {data.trends.map((row) => {
          const value = row[localFilters.metric]
          return (
            <div className="google-trend__bar" key={row.period}>
              <span style={{ height: `${Math.max(4, (value / max) * 100)}%` }} title={`${row.period}: ${formatMetric(localFilters.metric, value)}`} />
              <small>{row.period.replace('202', "'2")}</small>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
