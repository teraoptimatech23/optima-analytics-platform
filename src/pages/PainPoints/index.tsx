import { useMemo, useState } from 'react'
import { Inbox, Sparkles, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { queryPainPoints } from '@/data/painPointSelectors'
import type { PainPointCompareDimension } from '@/data/painPointSelectors'
import { formatNumber } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import PainPointAnalysisSections from './components/PainPointAnalysisSections'
import PainPointPriorityMatrix from './components/PainPointPriorityMatrix'
import PainPointRankingRootCause from './components/PainPointRankingRootCause'
import PainPointSummaryCards from './components/PainPointSummaryCards'
import PainPointTables from './components/PainPointTables'
import './index.less'

export default function PainPoints() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [compareDimension, setCompareDimension] = useState<PainPointCompareDimension>('region')
  const [comparisonMetric, setComparisonMetric] = useState<'frequencyRate' | 'severity' | 'businessImpact'>('frequencyRate')
  const data = useMemo(() => (cube ? queryPainPoints(cube, filters, compareDimension) : null), [compareDimension, cube, filters])
  const empty = !loading && !error && data !== null && data.summary.totalReports === 0

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (empty || !data) {
    body = (
      <StateMessage
        icon={Inbox}
        title="Tidak ada data pain point untuk kombinasi filter ini."
        description="Ubah periode, wilayah, outlet, gender, atau usia pada filter global untuk melihat pain point lain."
      />
    )
  } else {
    body = (
      <>
        <PainPointSummaryCards summary={data.summary} />
        <PainPointPriorityMatrix data={data} />
        <PainPointRankingRootCause data={data} />
        <PainPointAnalysisSections
          data={data}
          compareDimension={compareDimension}
          metric={comparisonMetric}
          onCompareDimensionChange={setCompareDimension}
          onMetricChange={setComparisonMetric}
        />
        <PainPointTables data={data} />
      </>
    )
  }

  return (
    <div className="pain-points">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat pain points' : 'Pain points siap'}
      </p>
      <section className="pain-points__hero">
        <div className="hero-copy">
          <h1>
            Pain Points Pelanggan
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.filterLabel} · ${formatNumber(data.summary.totalReports)} laporan. Identifikasi hambatan utama dalam pengalaman pelanggan, dampaknya terhadap kepuasan, dan prioritas perbaikan yang paling mendesak.`
              : 'Identifikasi hambatan utama dalam pengalaman pelanggan, dampaknya terhadap kepuasan, dan prioritas perbaikan yang paling mendesak.'}
          </p>
        </div>
      </section>
      {body}
      <footer className="pain-points__source">
        Sumber Data: aggregate needs survey, transaksi POS, customer synthetic, survey satisfaction/NPS, hourly wait time.
      </footer>
    </div>
  )
}
