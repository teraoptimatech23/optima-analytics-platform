import { useMemo, useState } from 'react'
import { Inbox, Sparkles, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { queryCustomerNeeds } from '@/data/customerNeedsSelectors'
import type { CompareDimension } from '@/data/customerNeedsSelectors'
import { formatNumber } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import ImportancePerformanceMatrix from './components/ImportancePerformanceMatrix'
import NeedsCategoryAndComparison from './components/NeedsCategoryAndComparison'
import NeedsDetailTable from './components/NeedsDetailTable'
import NeedsInsightsRecommendations from './components/NeedsInsightsRecommendations'
import NeedsPriorityAndGap from './components/NeedsPriorityAndGap'
import NeedsSummaryCards from './components/NeedsSummaryCards'
import NeedsTrendAndExpectations from './components/NeedsTrendAndExpectations'
import './index.less'

export default function CustomerNeeds() {
  useInsights()

  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [compareDimension, setCompareDimension] = useState<CompareDimension>('region')
  const [comparisonMetric, setComparisonMetric] = useState<'importance' | 'performance' | 'gap'>('gap')
  const data = useMemo(
    () => (cube ? queryCustomerNeeds(cube, filters, compareDimension) : null),
    [compareDimension, cube, filters],
  )
  const empty = !loading && !error && data !== null && data.summary.totalResponses === 0

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (empty || !data) {
    body = (
      <StateMessage
        icon={Inbox}
        title="Tidak ada data kebutuhan pelanggan untuk kombinasi filter ini."
        description="Ubah periode, wilayah, outlet, gender, atau usia pada filter global untuk membuka slice kebutuhan lain."
      />
    )
  } else {
    body = (
      <>
        <NeedsSummaryCards summary={data.summary} />
        <ImportancePerformanceMatrix data={data} />
        <NeedsPriorityAndGap needs={data.needs} />
        <NeedsCategoryAndComparison
          data={data}
          compareDimension={compareDimension}
          metric={comparisonMetric}
          onCompareDimensionChange={setCompareDimension}
          onMetricChange={setComparisonMetric}
        />
        <NeedsTrendAndExpectations data={data} />
        <NeedsInsightsRecommendations data={data} />
        <NeedsDetailTable rows={data.needs} />
      </>
    )
  }

  return (
    <div className="customer-needs">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat kebutuhan pelanggan' : 'Kebutuhan pelanggan siap'}
      </p>

      <section className="customer-needs__hero">
        <div className="hero-copy">
          <h1>
            Kebutuhan Pelanggan
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.filterLabel} · ${formatNumber(data.summary.totalResponses)} responden. Pahami kebutuhan utama pelanggan, kesenjangan pengalaman, dan prioritas perbaikan berdasarkan data survei dan perilaku pembelian.`
              : 'Pahami kebutuhan utama pelanggan, kesenjangan pengalaman, dan prioritas perbaikan berdasarkan data survei dan perilaku pembelian.'}
          </p>
        </div>
      </section>

      {body}

      <footer className="customer-needs__source">
        Sumber Data: aggregate needs survey, transaksi POS, pelanggan synthetic, dan satisfaction transaksi periode aktif.
      </footer>
    </div>
  )
}
