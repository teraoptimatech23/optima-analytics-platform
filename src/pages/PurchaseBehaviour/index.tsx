import { useMemo } from 'react'
import { Inbox, Sparkles, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { queryPurchaseBehaviour } from '@/data/purchaseBehaviourSelectors'
import { formatNumber } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import PurchaseChannelProduct from './components/PurchaseChannelProduct'
import PurchaseDistributions from './components/PurchaseDistributions'
import PurchaseFunnelJourney from './components/PurchaseFunnelJourney'
import PurchaseInsightsTable from './components/PurchaseInsightsTable'
import PurchaseLoyaltyOutlet from './components/PurchaseLoyaltyOutlet'
import PurchaseSummaryCards from './components/PurchaseSummaryCards'
import PurchaseTimeAndBasket from './components/PurchaseTimeAndBasket'
import './index.less'

export default function PurchaseBehaviour() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const data = useMemo(() => (cube ? queryPurchaseBehaviour(cube, filters) : null), [cube, filters])
  const empty = !loading && !error && data !== null && data.summary.totalTransactions === 0

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (empty || !data) {
    body = (
      <StateMessage
        icon={Inbox}
        title="Tidak ada data perilaku pembelian untuk kombinasi filter ini."
        description="Ubah periode, wilayah, outlet, gender, atau usia pada filter global untuk melihat perilaku lainnya."
      />
    )
  } else {
    body = (
      <>
        <PurchaseSummaryCards summary={data.summary} />
        <PurchaseFunnelJourney funnel={data.funnel} journey={data.journey} />
        <PurchaseDistributions frequency={data.frequencyDistribution} recency={data.recencyDistribution} rfm={data.rfmSegments} />
        <PurchaseChannelProduct data={data} />
        <PurchaseTimeAndBasket heatmap={data.heatmap} peakHour={data.peakHour} peakDay={data.peakDay} basket={data.marketBasket} />
        <PurchaseLoyaltyOutlet data={data} />
        <PurchaseInsightsTable data={data} />
      </>
    )
  }

  return (
    <div className="purchase-behaviour">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat perilaku pembelian' : 'Perilaku pembelian siap'}
      </p>
      <section className="purchase-behaviour__hero">
        <div className="hero-copy">
          <h1>
            Perilaku Pembelian
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.periodLabel} · ${data.filterLabel} · ${formatNumber(data.summary.totalTransactions)} transaksi. Analisis pola transaksi, frekuensi pembelian, preferensi produk, loyalitas, dan perilaku pelanggan berdasarkan data transaksi.`
              : 'Analisis pola transaksi, frekuensi pembelian, preferensi produk, loyalitas, dan perilaku pelanggan berdasarkan data transaksi.'}
          </p>
        </div>
      </section>
      {body}
      <footer className="purchase-behaviour__source">
        Sumber Data: transaksi POS, customer aggregate, activity repeat, channel/category mix, hourly traffic, voucher/member aggregate.
      </footer>
    </div>
  )
}
