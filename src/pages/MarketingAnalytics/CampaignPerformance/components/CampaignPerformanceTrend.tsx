import type { Dispatch, SetStateAction } from 'react'
import { LineChart } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CampaignMetricKey, CampaignPerformanceInsights, CampaignPerformanceLocalFilters } from '@/data/campaignPerformanceSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas } from '@/data/formatters'

const metricOptions: [CampaignMetricKey, string][] = [
  ['spend', 'Spend'], ['impressions', 'Impressions'], ['clicks', 'Clicks'], ['ctr', 'CTR'],
  ['conversions', 'Conversions'], ['cpa', 'CPA'], ['conversionValue', 'Conversion Value'], ['roas', 'ROAS'],
  ['newCustomers', 'New Customers'], ['cac', 'CAC'],
]

const formatMetric = (metric: CampaignMetricKey, value: number) => {
  if (metric === 'spend' || metric === 'cpa' || metric === 'conversionValue' || metric === 'cac') return formatCompactCurrency(value)
  if (metric === 'ctr') return formatPercent(value, 2)
  if (metric === 'roas') return formatRoas(value)
  return formatCompactNumber(value)
}

export default function CampaignPerformanceTrend({
  data,
  localFilters,
  setLocalFilters,
}: {
  data: CampaignPerformanceInsights
  localFilters: CampaignPerformanceLocalFilters
  setLocalFilters: Dispatch<SetStateAction<CampaignPerformanceLocalFilters>>
}) {
  const rows = localFilters.channel === 'all' ? data.trends : data.trends.filter((row) => row.channel === localFilters.channel)
  const values = rows.map((row) => row[localFilters.metric])
  const max = Math.max(1, ...values)

  return (
    <GlassCard interactive={false} className="google-panel google-trend">
      <div className="google-panel__head">
        <SectionTitle icon={LineChart} title="Performance Trend" subtitle="Trend lintas channel dari unified selector" />
        <div className="google-controls" aria-label="Filter lokal Campaign Performance">
          <select aria-label="Metric trend" value={localFilters.metric} onChange={(event) => setLocalFilters((state) => ({ ...state, metric: event.target.value as CampaignMetricKey }))}>
            {metricOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Channel" value={localFilters.channel} onChange={(event) => setLocalFilters((state) => ({ ...state, channel: event.target.value }))}>
            <option value="all">Semua Channel</option>{data.availableChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
          <select aria-label="Objective" value={localFilters.objective} onChange={(event) => setLocalFilters((state) => ({ ...state, objective: event.target.value }))}>
            <option value="all">Semua Objective</option>{data.availableObjectives.map((objective) => <option key={objective} value={objective}>{objective}</option>)}
          </select>
          <select aria-label="Ranking metric" value={localFilters.rankingMetric} onChange={(event) => setLocalFilters((state) => ({ ...state, rankingMetric: event.target.value as CampaignPerformanceLocalFilters['rankingMetric'] }))}>
            <option value="campaignScore">Rank: Campaign Score</option><option value="roas">Rank: ROAS</option><option value="conversions">Rank: Conversions</option><option value="conversionValue">Rank: Conversion Value</option><option value="newCustomers">Rank: New Customers</option><option value="cpa">Rank: CPA</option>
          </select>
          <select aria-label="Granularity" value={localFilters.granularity} onChange={(event) => setLocalFilters((state) => ({ ...state, granularity: event.target.value as CampaignPerformanceLocalFilters['granularity'] }))}>
            <option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="daily">Daily</option>
          </select>
        </div>
      </div>
      <div className="google-trend__chart" role="img" aria-label={`Trend ${localFilters.metric}`}>
        {rows.map((row) => {
          const value = row[localFilters.metric]
          return (
            <div className={`google-trend__bar campaign-trend--${row.channel.toLowerCase().replace(/\s+/g, '-')}`} key={`${row.period}-${row.channel}`}>
              <span style={{ height: `${Math.max(4, (value / max) * 100)}%` }} title={`${row.period} ${row.channel}: ${formatMetric(localFilters.metric, value)}`} />
              <small>{row.period.replace('202', "'2")}<br />{row.channel.replace(' Ads', '')}</small>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
