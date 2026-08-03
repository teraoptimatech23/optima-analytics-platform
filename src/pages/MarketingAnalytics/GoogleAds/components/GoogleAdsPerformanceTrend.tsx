import type { Dispatch, SetStateAction } from 'react'
import { LineChart } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { GoogleAdsInsights, GoogleAdsLocalFilters } from '@/data/googleAdsSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatRoas } from '@/data/formatters'

const metricOptions = [
  ['spend', 'Spend'],
  ['impressions', 'Impressions'],
  ['clicks', 'Clicks'],
  ['ctr', 'CTR'],
  ['conversions', 'Conversions'],
  ['cpa', 'CPA'],
  ['conversionValue', 'Conversion Value'],
  ['roas', 'ROAS'],
] as const

const formatMetric = (metric: GoogleAdsLocalFilters['metric'], value: number) => {
  if (metric === 'spend' || metric === 'cpa' || metric === 'conversionValue') return formatCompactCurrency(value)
  if (metric === 'ctr') return formatPercent(value, 2)
  if (metric === 'roas') return formatRoas(value)
  return formatCompactNumber(value)
}

interface Props {
  data: GoogleAdsInsights
  localFilters: GoogleAdsLocalFilters
  setLocalFilters: Dispatch<SetStateAction<GoogleAdsLocalFilters>>
}

export default function GoogleAdsPerformanceTrend({ data, localFilters, setLocalFilters }: Props) {
  const values = data.trends.map((row) => row[localFilters.metric])
  const max = Math.max(1, ...values)

  return (
    <GlassCard interactive={false} className="google-panel google-trend">
      <div className="google-panel__head">
        <SectionTitle icon={LineChart} title="Performance Overview" subtitle="Trend agregat dari fact table Google Ads" />
        <div className="google-controls" aria-label="Filter lokal Google Ads">
          <select aria-label="Metric trend" value={localFilters.metric} onChange={(event) => setLocalFilters((state) => ({ ...state, metric: event.target.value as GoogleAdsLocalFilters['metric'] }))}>
            {metricOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Granularity" value={localFilters.granularity} onChange={(event) => setLocalFilters((state) => ({ ...state, granularity: event.target.value as GoogleAdsLocalFilters['granularity'] }))}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
          <select aria-label="Campaign type" value={localFilters.campaignType} onChange={(event) => setLocalFilters((state) => ({ ...state, campaignType: event.target.value }))}>
            <option value="all">Semua Campaign Type</option>
            {data.availableCampaignTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select aria-label="Campaign" value={localFilters.campaignId} onChange={(event) => setLocalFilters((state) => ({ ...state, campaignId: event.target.value }))}>
            <option value="all">Semua Campaign</option>
            {data.availableCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          <select aria-label="Device" value={localFilters.device} onChange={(event) => setLocalFilters((state) => ({ ...state, device: event.target.value }))}>
            <option value="all">Semua Device</option>
            {data.availableDevices.map((device) => <option key={device} value={device}>{device}</option>)}
          </select>
          <select aria-label="Keyword intent" value={localFilters.intent} onChange={(event) => setLocalFilters((state) => ({ ...state, intent: event.target.value }))}>
            <option value="all">Semua Intent</option>
            {data.availableIntents.map((intent) => <option key={intent} value={intent}>{intent}</option>)}
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
