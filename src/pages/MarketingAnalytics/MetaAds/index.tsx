import { useMemo, useState } from 'react'
import { BadgeInfo, Inbox, Sparkles, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { queryMetaAds } from '@/data/metaAdsSelectors'
import type { MetaAdsLocalFilters } from '@/data/metaAdsSelectors'
import { formatCompactCurrency, formatCompactNumber } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import MetaAdsBreakdowns from './components/MetaAdsBreakdowns'
import MetaAdsFunnelMatrix from './components/MetaAdsFunnelMatrix'
import MetaAdsInsightsActions from './components/MetaAdsInsightsActions'
import MetaAdsPerformanceTrend from './components/MetaAdsPerformanceTrend'
import MetaAdsSummaryCards from './components/MetaAdsSummaryCards'
import MetaCampaignPerformanceTable from './components/MetaCampaignPerformanceTable'
import './index.less'

const initialLocalFilters: MetaAdsLocalFilters = {
  objective: 'all',
  campaignId: 'all',
  audienceDimension: 'age',
  metric: 'spend',
  granularity: 'monthly',
}

export default function MetaAdsAnalytics() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<MetaAdsLocalFilters>(initialLocalFilters)
  const data = useMemo(() => (cube ? queryMetaAds(cube, filters, localFilters) : null), [cube, filters, localFilters])
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
        title="Tidak ada data Meta Ads untuk kombinasi filter ini."
        description="Ubah filter global atau filter lokal objective dan campaign untuk melihat performa lainnya."
      />
    )
  } else {
    body = (
      <>
        <MetaAdsSummaryCards data={data} />
        <MetaAdsPerformanceTrend data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        <MetaAdsFunnelMatrix data={data} />
        <MetaCampaignPerformanceTable rows={data.campaigns} />
        <MetaAdsBreakdowns data={data} />
        <MetaAdsInsightsActions data={data} />
      </>
    )
  }

  return (
    <div className="google-ads meta-ads">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Meta Ads Analytics' : 'Meta Ads Analytics siap'}
      </p>
      <section className="google-ads__hero">
        <div className="hero-copy">
          <span>Marketing Analytics</span>
          <h1>
            Meta Ads Analytics
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.filterLabel} · ${formatCompactCurrency(data.summary.spend)} spend · ${formatCompactNumber(data.summary.conversions)} conversions. Analisis performa kampanye Facebook dan Instagram dari jangkauan, engagement, traffic, conversion, hingga kualitas pelanggan yang dihasilkan.`
              : 'Analisis performa kampanye Facebook dan Instagram dari jangkauan, engagement, traffic, conversion, hingga kualitas pelanggan yang dihasilkan.'}
          </p>
        </div>
        <div className="google-ads__source-badge">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Production Dataset</span>
        </div>
      </section>
      {body}
      <footer className="google-ads__source">
        Sumber Data: `metaAds` aggregate dari meta_ads_performance.csv, campaign dimension, filter global, dan generated media cube.
      </footer>
    </div>
  )
}
