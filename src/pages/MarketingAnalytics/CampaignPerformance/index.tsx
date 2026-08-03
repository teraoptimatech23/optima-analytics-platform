import { useMemo, useState } from 'react'
import { BadgeInfo, Inbox, Sparkles, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { queryCampaignPerformance } from '@/data/campaignPerformanceSelectors'
import type { CampaignPerformanceLocalFilters } from '@/data/campaignPerformanceSelectors'
import { formatCompactCurrency, formatCompactNumber } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import CampaignAnalysisPanels from './components/CampaignAnalysisPanels'
import CampaignLeaderboard from './components/CampaignLeaderboard'
import CampaignPerformanceTrend from './components/CampaignPerformanceTrend'
import CampaignSummaryCards from './components/CampaignSummaryCards'
import CrossChannelOverview from './components/CrossChannelOverview'
import './index.less'

const initialLocalFilters: CampaignPerformanceLocalFilters = {
  channel: 'all',
  objective: 'all',
  status: 'all',
  trendStatus: 'all',
  metric: 'spend',
  granularity: 'monthly',
  rankingMetric: 'campaignScore',
}

export default function CampaignPerformance() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<CampaignPerformanceLocalFilters>(initialLocalFilters)
  const data = useMemo(() => (cube ? queryCampaignPerformance(cube, filters, localFilters) : null), [cube, filters, localFilters])
  const empty = !loading && !error && data !== null && data.summary.impressions === 0

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (empty || !data) {
    body = <StateMessage icon={Inbox} title="Tidak ada data campaign untuk kombinasi filter ini." description="Ubah filter global atau filter lokal channel/objective/status untuk melihat campaign lain." />
  } else {
    body = (
      <>
        <CampaignSummaryCards data={data} />
        <CampaignPerformanceTrend data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        <CrossChannelOverview data={data} />
        <CampaignLeaderboard rows={data.campaigns} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        <CampaignAnalysisPanels data={data} />
      </>
    )
  }

  return (
    <div className="google-ads campaign-performance">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Campaign Performance' : 'Campaign Performance siap'}
      </p>
      <section className="google-ads__hero">
        <div className="hero-copy">
          <span>Marketing Analytics</span>
          <h1>
            Campaign Performance
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.filterLabel} · ${formatCompactCurrency(data.summary.spend)} spend · ${formatCompactNumber(data.summary.conversions)} conversions. Bandingkan performa kampanye lintas channel dari awareness, engagement, conversion, revenue, hingga kualitas pelanggan.`
              : 'Bandingkan performa kampanye lintas channel dari awareness, engagement, conversion, revenue, hingga kualitas pelanggan.'}
          </p>
        </div>
        <div className="google-ads__source-badge">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Production Dataset</span>
        </div>
      </section>
      {body}
      <footer className="google-ads__source">
        Sumber Data: unified selector dari `googleAds`, `metaAds`, `media`, campaign dimension, customer acquisition source, dan filter global.
      </footer>
    </div>
  )
}
