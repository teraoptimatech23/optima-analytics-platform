import { Inbox, Sparkles, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import KpiCard from '@/components/dashboard/KpiCard/KpiCard'
import KpiTable from '@/components/dashboard/KpiTable/KpiTable'
import MotivationCard from '@/components/dashboard/MotivationCard/MotivationCard'
import NeedsCard from '@/components/dashboard/NeedsCard/NeedsCard'
import PainPointCard from '@/components/dashboard/PainPointCard/PainPointCard'
import PerceptionCard from '@/components/dashboard/PerceptionCard/PerceptionCard'
import ProfileCard from '@/components/dashboard/ProfileCard/ProfileCard'
import PurchaseCard from '@/components/dashboard/PurchaseCard/PurchaseCard'
import RecommendationCard from '@/components/dashboard/RecommendationCard/RecommendationCard'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import './index.less'

export default function Dashboard() {
  useInsights()

  const data = useDashboardStore((state) => state.data)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)

  const isEmpty = !loading && !error && data !== null && data.scope.transactions === 0

  // Hero and footer stay put; only the body swaps between the four states.
  let body
  let status = ''
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
    status = 'Memuat data dashboard'
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
    status = `Data gagal dimuat. ${error}`
  } else if (isEmpty || !data) {
    body = (
      <StateMessage
        icon={Inbox}
        title="Belum ada data untuk filter ini"
        description="Coba ubah periode, wilayah, atau outlet pada filter di bagian atas untuk melihat insight lainnya."
      />
    )
    status = 'Tidak ada data untuk filter yang dipilih'
  } else {
    body = (
      <>
        <section className="dashboard-page__kpis" aria-label="Ringkasan KPI">
          {data.kpis.map(({ id, ...item }) => (
            <KpiCard key={id} {...item} />
          ))}
        </section>

        <section className="dashboard-page__insights" aria-label="Insight pelanggan">
          <ProfileCard items={data.profiles} total={data.scope.customers.toLocaleString('id-ID')} />
          <NeedsCard items={data.needs} />
          <PainPointCard items={data.painPoints} />
          <MotivationCard items={data.motivations} />
        </section>

        <section className="dashboard-page__analysis" aria-label="Analisis perilaku dan KPI">
          <PurchaseCard
            frequency={data.purchase.frequency}
            averageLabel={data.purchase.averageLabel}
            channels={data.purchase.channels}
            heatmap={data.purchase.heatmap}
          />
          <PerceptionCard
            traits={data.perception.traits}
            associations={data.perception.associations}
            positionX={data.perception.positionX}
            positionY={data.perception.positionY}
          />
          <KpiTable rows={data.kpiSummary} />
        </section>

        <section className="dashboard-page__actions" aria-label="Rekomendasi tindakan">
          {data.recommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.index} {...recommendation} />
          ))}
        </section>
      </>
    )
  }

  return (
    <div className="dashboard-page">
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      <section className="dashboard-page__hero">
        <div className="hero-copy">
          <h1>
            Insight Pelanggan Kopi Kenangan
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.scope.transactions.toLocaleString('id-ID')} transaksi dari ${data.scope.customers.toLocaleString('id-ID')} pelanggan di ${data.scope.outlets} outlet · ${data.scope.periodLabel}.`
              : 'Memahami pelanggan lebih dalam untuk memberikan pengalaman terbaik di setiap momen bersama Kopi Kenangan.'}
          </p>
        </div>

        {/* Abstract glass scenery replaces the product imagery from the reference. */}
        <div className="hero-glass" aria-hidden="true">
          <span className="hero-glass__orb hero-glass__orb--one" />
          <span className="hero-glass__orb hero-glass__orb--two" />
          <span className="hero-glass__wave" />
        </div>
      </section>

      {body}

      <footer className="dashboard-page__source">
        Sumber Data: Transaksi POS, Survei Pelanggan, Aplikasi Kopi Kenangan, Google Ads, Meta Ads, YouTube Ads
      </footer>
    </div>
  )
}
