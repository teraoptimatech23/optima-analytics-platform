import { useMemo, useState } from 'react'
import { BadgeInfo, Inbox, Sparkles, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { queryGoogleAds } from '@/data/googleAdsSelectors'
import type { GoogleAdsLocalFilters } from '@/data/googleAdsSelectors'
import { formatCompactCurrency, formatCompactNumber } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import CampaignPerformanceTable from './components/CampaignPerformanceTable'
import GoogleAdsBreakdowns from './components/GoogleAdsBreakdowns'
import GoogleAdsFunnelMatrix from './components/GoogleAdsFunnelMatrix'
import GoogleAdsInsightsActions from './components/GoogleAdsInsightsActions'
import GoogleAdsPerformanceTrend from './components/GoogleAdsPerformanceTrend'
import GoogleAdsSummaryCards from './components/GoogleAdsSummaryCards'
import KeywordPerformance from './components/KeywordPerformance'
import './index.less'

const initialLocalFilters: GoogleAdsLocalFilters = {
  campaignType: 'all',
  device: 'all',
  intent: 'all',
  campaignId: 'all',
  metric: 'spend',
  granularity: 'monthly',
}

export default function GoogleAdsAnalytics() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<GoogleAdsLocalFilters>(initialLocalFilters)
  const data = useMemo(() => (cube ? queryGoogleAds(cube, filters, localFilters) : null), [cube, filters, localFilters])
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
        title="Tidak ada data Google Ads untuk kombinasi filter ini."
        description="Ubah filter global atau filter lokal campaign, device, dan intent untuk melihat performa lainnya."
      />
    )
  } else {
    body = (
      <>
        <GoogleAdsSummaryCards data={data} />
        <GoogleAdsPerformanceTrend data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        <GoogleAdsFunnelMatrix data={data} />
        <CampaignPerformanceTable rows={data.campaigns} />
        <GoogleAdsBreakdowns data={data} />
        <KeywordPerformance rows={data.keywords} />
        <GoogleAdsInsightsActions data={data} />
      </>
    )
  }

  return (
    <div className="google-ads">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Google Ads Analytics' : 'Google Ads Analytics siap'}
      </p>
      <section className="google-ads__hero">
        <div className="hero-copy">
          <span>Marketing Analytics</span>
          <h1>
            Google Ads Analytics
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.filterLabel} · ${formatCompactCurrency(data.summary.spend)} spend · ${formatCompactNumber(data.summary.conversions)} conversions. Analisis performa kampanye Google Ads dari awareness hingga conversion, revenue, dan customer acquisition.`
              : 'Analisis performa kampanye Google Ads dari awareness hingga conversion, revenue, dan customer acquisition.'}
          </p>
        </div>
        <div className="google-ads__source-badge">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Production Dataset</span>
        </div>
      </section>
      {body}
      <footer className="google-ads__source">
        Sumber Data: `googleAds` aggregate dari google_ads_performance.csv, campaign dimension, filter global, dan generated media cube.
      </footer>
    </div>
  )
}
