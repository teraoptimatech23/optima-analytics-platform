import { useMemo, useState } from 'react'
import {
  BadgeInfo,
  BarChart3,
  Clock3,
  Eye,
  Film,
  Gauge,
  Inbox,
  LineChart,
  MousePointerClick,
  Percent,
  ReceiptText,
  RefreshCcw,
  Sparkles,
  Target,
  TriangleAlert,
  UsersRound,
  X,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { queryYouTubeAds } from '@/data/youtubeAdsSelectors'
import type {
  YouTubeAdsInsights,
  YouTubeAdsLocalFilters,
  YouTubeCampaignPerformance,
  YouTubeDimensionMetric,
  YouTubeMetricKey,
} from '@/data/youtubeAdsSelectors'
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const initialLocalFilters: YouTubeAdsLocalFilters = {
  campaignId: 'all',
  objective: 'all',
  location: 'all',
  ageRange: 'all',
  gender: 'all',
  metric: 'views',
  status: 'all',
  fatigueStatus: 'all',
}

const metricOptions: Array<[YouTubeMetricKey, string]> = [
  ['spend', 'Spend'],
  ['impressions', 'Impressions'],
  ['views', 'Video Views'],
  ['viewRate', 'View Rate'],
  ['averageWatchTime', 'Avg Watch Time'],
  ['completionRate', 'Completion Rate'],
  ['websiteClicks', 'Website Clicks'],
  ['ctr', 'CTR'],
  ['conversions', 'Conversions'],
  ['cpa', 'CPA'],
  ['cpv', 'CPV'],
  ['cpm', 'CPM'],
  ['videoQualityScore', 'Video Quality Score'],
]

const statusLabels: Record<YouTubeCampaignPerformance['status'], string> = {
  scale: 'Scale',
  'strong-attention': 'Strong Attention',
  'efficient-conversion': 'Efficient Conversion',
  monitor: 'Monitor',
  underperforming: 'Underperforming',
}

const fatigueLabels: Record<YouTubeCampaignPerformance['fatigueStatus'], string> = {
  healthy: 'Healthy',
  monitor: 'Monitor',
  'fatigue-risk': 'Fatigue Risk',
  'insufficient-history': 'Insufficient History',
}

const formatSeconds = (value: number) => `${value.toFixed(1).replace('.', ',')} detik`
const formatScore = (value: number) => `${Math.round(value).toLocaleString('id-ID')}/100`

const formatMetric = (metric: YouTubeMetricKey, value: number) => {
  if (metric === 'spend' || metric === 'cpa' || metric === 'cpv' || metric === 'cpm') return formatCompactCurrency(value)
  if (metric === 'viewRate' || metric === 'completionRate' || metric === 'ctr') return formatPercent(value, 2)
  if (metric === 'averageWatchTime') return formatSeconds(value)
  if (metric === 'videoQualityScore') return formatScore(value)
  return formatCompactNumber(value)
}

function KpiCards({ data }: { data: YouTubeAdsInsights }) {
  const cards = [
    { key: 'spend', label: 'Ad Spend', icon: ReceiptText, format: formatCompactCurrency, title: formatCurrency },
    { key: 'impressions', label: 'Impressions', icon: Eye, format: formatCompactNumber, title: formatNumber },
    { key: 'views', label: 'Video Views', icon: Film, format: formatCompactNumber, title: formatNumber },
    { key: 'viewRate', label: 'View Rate', icon: Percent, format: (value: number) => formatPercent(value, 2), title: (value: number) => formatPercent(value, 3) },
    { key: 'averageWatchTime', label: 'Avg Watch Time', icon: Clock3, format: formatSeconds, title: formatSeconds },
    { key: 'completionRate', label: 'Completion Rate', icon: Gauge, format: (value: number) => formatPercent(value, 2), title: (value: number) => formatPercent(value, 3) },
    { key: 'websiteClicks', label: 'Website Clicks', icon: MousePointerClick, format: formatCompactNumber, title: formatNumber },
    { key: 'ctr', label: 'CTR', icon: Target, format: (value: number) => formatPercent(value, 2), title: (value: number) => formatPercent(value, 3) },
    { key: 'conversions', label: 'Conversions', icon: Sparkles, format: formatCompactNumber, title: formatNumber },
    { key: 'cpa', label: 'CPA', icon: BarChart3, format: formatCompactCurrency, title: formatCurrency },
    { key: 'cpv', label: 'CPV', icon: ReceiptText, format: formatCurrency, title: formatCurrency },
    { key: 'cpm', label: 'CPM', icon: UsersRound, format: formatCompactCurrency, title: formatCurrency },
  ] as const

  return (
    <section className="youtube-ads__summary" aria-label="YouTube Ads KPI summary">
      {cards.map(({ key, label, icon: Icon, format, title }) => {
        const value = data.summary[key]
        const delta = data.deltas[key] ?? 0
        const lowerIsBetter = key === 'cpa' || key === 'cpv' || key === 'cpm'
        const positive = lowerIsBetter ? delta <= 0 : delta >= 0
        return (
          <GlassCard interactive={false} className="youtube-kpi" key={key}>
            <span className="youtube-kpi__icon"><Icon size={18} /></span>
            <span className="youtube-kpi__label">{label}</span>
            <strong title={title(value)}>{format(value)}</strong>
            <small className={positive ? 'is-positive' : 'is-negative'}>{formatSignedPercent(delta)} vs periode sebelumnya</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function LocalFilters({
  data,
  localFilters,
  setLocalFilters,
}: {
  data: YouTubeAdsInsights
  localFilters: YouTubeAdsLocalFilters
  setLocalFilters: React.Dispatch<React.SetStateAction<YouTubeAdsLocalFilters>>
}) {
  return (
    <div className="youtube-controls" aria-label="Filter lokal YouTube Ads">
      <select aria-label="Metric trend" value={localFilters.metric} onChange={(event) => setLocalFilters((state) => ({ ...state, metric: event.target.value as YouTubeMetricKey }))}>
        {metricOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select aria-label="Objective" value={localFilters.objective} onChange={(event) => setLocalFilters((state) => ({ ...state, objective: event.target.value }))}>
        <option value="all">Semua Objective</option>
        {data.availableObjectives.map((objective) => <option key={objective} value={objective}>{objective}</option>)}
      </select>
      <select aria-label="Campaign" value={localFilters.campaignId} onChange={(event) => setLocalFilters((state) => ({ ...state, campaignId: event.target.value }))}>
        <option value="all">Semua Campaign</option>
        {data.availableCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
      </select>
      <select aria-label="Location" value={localFilters.location} onChange={(event) => setLocalFilters((state) => ({ ...state, location: event.target.value }))}>
        <option value="all">Semua Location</option>
        {data.availableLocations.map((location) => <option key={location} value={location}>{location}</option>)}
      </select>
      <select aria-label="Age range" value={localFilters.ageRange} onChange={(event) => setLocalFilters((state) => ({ ...state, ageRange: event.target.value }))}>
        <option value="all">Semua Age Range</option>
        {data.availableAgeRanges.map((age) => <option key={age} value={age}>{age}</option>)}
      </select>
      <select aria-label="Gender" value={localFilters.gender} onChange={(event) => setLocalFilters((state) => ({ ...state, gender: event.target.value }))}>
        <option value="all">Semua Gender</option>
        {data.availableGenders.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
      </select>
      <select aria-label="Performance status" value={localFilters.status} onChange={(event) => setLocalFilters((state) => ({ ...state, status: event.target.value }))}>
        <option value="all">Semua Status</option>
        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select aria-label="Fatigue status" value={localFilters.fatigueStatus} onChange={(event) => setLocalFilters((state) => ({ ...state, fatigueStatus: event.target.value }))}>
        <option value="all">Semua Fatigue Status</option>
        {Object.entries(fatigueLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button type="button" onClick={() => setLocalFilters(initialLocalFilters)}>
        <RefreshCcw size={15} />
        Reset YouTube Ads Filters
      </button>
    </div>
  )
}

function PerformanceTrend({ data, metric }: { data: YouTubeAdsInsights; metric: YouTubeMetricKey }) {
  const values = data.trends.map((row) => row[metric])
  const max = Math.max(1, ...values)
  return (
    <GlassCard interactive={false} className="youtube-panel youtube-trend">
      <SectionTitle icon={LineChart} title="Performance Overview" subtitle="Monthly aggregate dari fact table YouTube Ads" />
      <div className="youtube-trend__chart" role="img" aria-label={`Trend ${metric}`}>
        {data.trends.map((row) => {
          const value = row[metric]
          return (
            <div className="youtube-trend__bar" key={row.period}>
              <span style={{ height: `${Math.max(4, (value / max) * 100)}%` }} title={`${row.period}: ${formatMetric(metric, value)}`} />
              <small>{row.period.replace('202', "'2")}</small>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

function VideoFunnel({ data }: { data: YouTubeAdsInsights }) {
  const max = Math.max(1, data.funnel[0]?.value ?? 1)
  return (
    <GlassCard interactive={false} className="youtube-panel">
      <SectionTitle icon={Gauge} title="Video Engagement Funnel" subtitle="Completion memakai completed views, bukan conversion" />
      <div className="youtube-funnel">
        {data.funnel.map((step) => (
          <article className="youtube-funnel__step" key={step.stage}>
            <div>
              <strong>{step.stage}</strong>
              <span>{formatCompactNumber(step.value)}</span>
            </div>
            <i style={{ width: `${Math.max(2, (step.value / max) * 100)}%` }} />
            <small>
              {step.rateFromPrevious === undefined ? 'Base stage' : `${formatPercent(step.rateFromPrevious, 2)} dari stage sebelumnya`}
              {step.cumulativeRate !== undefined ? ` - cumulative ${formatPercent(step.cumulativeRate, 2)}` : ''}
              {step.costPerStage ? ` - cost ${formatCurrency(step.costPerStage)}` : ''}
            </small>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function QualityMatrix({ campaigns, onSelect }: { campaigns: YouTubeCampaignPerformance[]; onSelect: (campaign: YouTubeCampaignPerformance) => void }) {
  const maxViews = Math.max(1, ...campaigns.map((row) => row.views))
  return (
    <GlassCard interactive={false} className="youtube-panel">
      <SectionTitle icon={Target} title="YouTube Campaign Quality Matrix" subtitle="Objective-aware decision support score" />
      <div className="youtube-matrix" role="img" aria-label="Campaign quality matrix">
        {campaigns.map((campaign) => {
          const awareness = ['Video Reach', 'Video Views'].includes(campaign.objective)
          const x = awareness ? Math.max(6, Math.min(94, 100 - campaign.cpv / Math.max(1, ...campaigns.map((row) => row.cpv)) * 88)) : Math.max(6, Math.min(94, 100 - campaign.cpa / Math.max(1, ...campaigns.map((row) => row.cpa)) * 88))
          const y = awareness ? Math.max(6, Math.min(94, campaign.videoQualityScore)) : Math.max(6, Math.min(94, campaign.conversionRate * 1000))
          const size = 28 + (campaign.views / maxViews) * 26
          return (
            <button
              className={`youtube-matrix__dot youtube-matrix__dot--${campaign.status}`}
              key={campaign.campaignId}
              style={{ left: `${x}%`, bottom: `${y}%`, width: size, height: size }}
              type="button"
              title={`${campaign.campaignName}: ${statusLabels[campaign.status]}`}
              onClick={() => onSelect(campaign)}
            >
              {campaign.campaignId.replace('CP', '')}
            </button>
          )
        })}
      </div>
      <div className="youtube-matrix__legend">
        <span>Efficient but Low Volume</span>
        <span>Scale Reach / Scale</span>
        <span>Optimize Creative</span>
        <span>Strong Attention but Expensive</span>
      </div>
    </GlassCard>
  )
}

function DimensionRows({ title, rows, metric }: { title: string; rows: YouTubeDimensionMetric[]; metric: YouTubeMetricKey }) {
  const max = Math.max(1, ...rows.map((row) => row[metric]))
  return (
    <GlassCard interactive={false} className="youtube-panel">
      <SectionTitle icon={BarChart3} title={title} subtitle={`Ranking berdasarkan ${metricOptions.find(([key]) => key === metric)?.[1] ?? metric}`} />
      <div className="youtube-breakdown">
        {rows.slice(0, 8).map((row) => (
          <article key={`${title}-${row.id}`}>
            <div>
              <strong>{row.label}</strong>
              <span>{formatCompactCurrency(row.spend)} spend - {formatCompactNumber(row.views)} views - {formatPercent(row.completionRate, 1)} completion</span>
            </div>
            <small>{formatMetric(metric, row[metric])}</small>
            <i><b style={{ width: `${Math.max(2, (row[metric] / max) * 100)}%` }} /></i>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}

function CampaignTable({ rows, onSelect }: { rows: YouTubeCampaignPerformance[]; onSelect: (campaign: YouTubeCampaignPerformance) => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8
  const filtered = rows.filter((row) => row.campaignName.toLowerCase().includes(search.toLowerCase()))
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <GlassCard interactive={false} className="youtube-panel youtube-table-card">
      <div className="youtube-panel__head">
        <SectionTitle icon={Film} title="Campaign Performance" subtitle="Status dievaluasi sesuai objective campaign" />
        <label className="youtube-search">
          <span className="sr-only">Search campaign</span>
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search campaign" />
        </label>
      </div>
      <div className="youtube-table-wrap">
        <table className="youtube-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Objective</th>
              <th>Spend</th>
              <th>Impressions</th>
              <th>Views</th>
              <th>View Rate</th>
              <th>CPV</th>
              <th>Avg Watch</th>
              <th>Completion</th>
              <th>Clicks</th>
              <th>CTR</th>
              <th>Conversions</th>
              <th>CPA</th>
              <th>Quality</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.campaignId} onClick={() => onSelect(row)}>
                <td><button type="button">{row.campaignName}</button></td>
                <td>{row.objective}</td>
                <td>{formatCompactCurrency(row.spend)}</td>
                <td>{formatCompactNumber(row.impressions)}</td>
                <td>{formatCompactNumber(row.views)}</td>
                <td>{formatPercent(row.viewRate, 1)}</td>
                <td>{formatCurrency(row.cpv)}</td>
                <td>{formatSeconds(row.averageWatchTime)}</td>
                <td>{formatPercent(row.completionRate, 1)}</td>
                <td>{formatCompactNumber(row.websiteClicks)}</td>
                <td>{formatPercent(row.ctr, 2)}</td>
                <td>{formatCompactNumber(row.conversions)}</td>
                <td>{formatCompactCurrency(row.cpa)}</td>
                <td>{formatScore(row.videoQualityScore)}</td>
                <td><span className={`youtube-status youtube-status--${row.status}`}>{statusLabels[row.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="youtube-pagination">
        <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button>
        <span>Page {page} / {pageCount}</span>
        <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
      </div>
    </GlassCard>
  )
}

function InsightActions({ data }: { data: YouTubeAdsInsights }) {
  return (
    <section className="youtube-ads__grid youtube-ads__grid--two">
      <GlassCard interactive={false} className="youtube-panel youtube-list">
        <SectionTitle icon={Sparkles} title="YouTube Ads Insights" subtitle="Generated dari filter aktif" />
        <ol>
          {data.insights.map((insight) => <li key={insight}>{insight}</li>)}
        </ol>
      </GlassCard>
      <GlassCard interactive={false} className="youtube-panel youtube-actions">
        <SectionTitle icon={Target} title="Recommended Actions" subtitle="Objective-aware dan tanpa klaim uplift pasti" />
        <div className="youtube-actions__list">
          {data.recommendations.map((item) => (
            <article key={`${item.campaignId}-${item.issue}`}>
              <span className={`youtube-priority youtube-priority--${item.priority}`}>{item.priority}</span>
              <strong>{item.issue}</strong>
              <p>{item.evidence}</p>
              <small>{item.action}</small>
              <em>{item.expectedDirection}</em>
              <small>{item.limitationNote}</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}

function UnavailableSections({ data }: { data: YouTubeAdsInsights }) {
  return (
    <GlassCard interactive={false} className="youtube-panel youtube-unavailable">
      <SectionTitle icon={BadgeInfo} title="Data Availability & Metric Definitions" subtitle="Bagian yang tidak ditampilkan tidak diisi data palsu" />
      <div className="youtube-unavailable__grid">
        <div>
          <strong>Unavailable / Insufficient Data</strong>
          <ul>
            {data.unavailableSections.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <strong>Metric Definitions</strong>
          <ul>
            {Object.values(data.metricDefinitions).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </GlassCard>
  )
}

function CampaignDrawer({ campaign, onClose }: { campaign: YouTubeCampaignPerformance | null; onClose: () => void }) {
  if (!campaign) return null
  return (
    <aside className="youtube-drawer" aria-label="Campaign detail drawer">
      <div className="youtube-drawer__panel">
        <button className="youtube-drawer__close" type="button" aria-label="Close drawer" onClick={onClose}><X size={18} /></button>
        <span className={`youtube-status youtube-status--${campaign.status}`}>{statusLabels[campaign.status]}</span>
        <h2>{campaign.campaignName}</h2>
        <p>{campaign.objective} - evaluasi objective-aware. Views, clicks, completion, dan conversions tidak disamakan.</p>
        <dl>
          <div><dt>View Rate</dt><dd>{formatPercent(campaign.viewRate, 2)}</dd></div>
          <div><dt>Completion Rate</dt><dd>{formatPercent(campaign.completionRate, 2)}</dd></div>
          <div><dt>Average Watch Time</dt><dd>{formatSeconds(campaign.averageWatchTime)}</dd></div>
          <div><dt>CPV</dt><dd>{formatCurrency(campaign.cpv)}</dd></div>
          <div><dt>CPA</dt><dd>{formatCurrency(campaign.cpa)}</dd></div>
          <div><dt>Video Quality Score</dt><dd>{formatScore(campaign.videoQualityScore)}</dd></div>
          <div><dt>Fatigue Indication</dt><dd>{fatigueLabels[campaign.fatigueStatus]} ({campaign.fatigueScore.toFixed(2).replace('.', ',')})</dd></div>
        </dl>
        <section>
          <strong>Evidence</strong>
          <p>
            {formatCompactNumber(campaign.impressions)} impressions, {formatCompactNumber(campaign.views)} views,
            {formatCompactNumber(campaign.completedViews)} completed views, {formatCompactNumber(campaign.websiteClicks)} website clicks,
            dan {formatCompactNumber(campaign.conversions)} conversions.
          </p>
        </section>
        <section>
          <strong>Limitation</strong>
          <p>Dataset belum menyediakan video-level creative, placement, device, view-through conversion, atau conversion value untuk ROAS YouTube.</p>
        </section>
      </div>
    </aside>
  )
}

export default function YouTubeAdsAnalytics() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<YouTubeAdsLocalFilters>(initialLocalFilters)
  const [selectedCampaign, setSelectedCampaign] = useState<YouTubeCampaignPerformance | null>(null)
  const data = useMemo(() => (cube ? queryYouTubeAds(cube, filters, localFilters) : null), [cube, filters, localFilters])
  const empty = !loading && !error && data !== null && data.summary.impressions === 0

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (empty || !data) {
    body = (
      <StateMessage
        icon={Inbox}
        title="Tidak ada data YouTube Ads untuk kombinasi filter ini."
        description="Ubah filter global atau filter lokal campaign, objective, location, age, dan gender untuk melihat performa lainnya."
      />
    )
  } else {
    body = (
      <>
        <LocalFilters data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        <KpiCards data={data} />
        <PerformanceTrend data={data} metric={localFilters.metric} />
        <section className="youtube-ads__grid youtube-ads__grid--two">
          <VideoFunnel data={data} />
          <QualityMatrix campaigns={data.qualityMatrix} onSelect={setSelectedCampaign} />
        </section>
        <CampaignTable rows={data.campaigns} onSelect={setSelectedCampaign} />
        <section className="youtube-ads__grid youtube-ads__grid--three">
          <DimensionRows title="Objective Performance" rows={data.objectives} metric={localFilters.metric} />
          <DimensionRows title="Audience Performance" rows={data.audiences} metric={localFilters.metric} />
          <DimensionRows title="Geographic Performance" rows={data.locations} metric={localFilters.metric} />
        </section>
        <section className="youtube-ads__grid youtube-ads__grid--three">
          <DimensionRows title="Age Performance" rows={data.ageGroups} metric={localFilters.metric} />
          <DimensionRows title="Gender Performance" rows={data.genders} metric={localFilters.metric} />
          <DimensionRows title="Watch Time Analysis" rows={data.campaigns.map((row) => ({ ...row, id: row.campaignId, label: row.campaignName }))} metric="averageWatchTime" />
        </section>
        <InsightActions data={data} />
        <UnavailableSections data={data} />
      </>
    )
  }

  return (
    <div className="youtube-ads">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat YouTube Ads Analytics' : 'YouTube Ads Analytics siap'}
      </p>
      <section className="youtube-ads__hero">
        <div className="hero-copy">
          <span>Marketing Analytics</span>
          <h1>
            YouTube Ads Analytics
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.periodLabel} - ${data.filterLabel}. Analisis performa video advertising dari impressions, views, watch quality, engagement, conversion, hingga kualitas pelanggan yang dihasilkan.`
              : 'Analisis performa video advertising dari impressions, views, watch quality, engagement, conversion, hingga kualitas pelanggan yang dihasilkan.'}
          </p>
        </div>
        <div className="youtube-ads__source-badge" title="Video engagement dan conversion merupakan metrik yang berbeda dan tidak boleh disamakan.">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Production Dataset</span>
        </div>
      </section>
      {body}
      <footer className="youtube-ads__source">
        Sumber Data: `youtubeAds` aggregate dari youtube_ads_performance.csv dan campaign dimension. Attribution/customer quality tidak diklaim karena relasi campaign-customer tidak tersedia.
      </footer>
      <CampaignDrawer campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
    </div>
  )
}
