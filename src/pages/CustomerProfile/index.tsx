import { useMemo } from 'react'
import { Inbox, Sparkles, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { queryCustomerProfile } from '@/data/customerProfileSelectors'
import { formatNumber } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import CustomerBehaviour from './components/CustomerBehaviour'
import CustomerSegments from './components/CustomerSegments'
import CustomerTable from './components/CustomerTable'
import { DemographicsSection, LocationsSection, PreferencesSection } from './components/ProfileCharts'
import ProfileSummaryCards from './components/ProfileSummaryCards'
import './index.less'

export default function CustomerProfile() {
  useInsights()

  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)

  const data = useMemo(() => (cube ? queryCustomerProfile(cube, filters) : null), [cube, filters])
  const empty = !loading && !error && data !== null && data.summary.totalCustomers === 0

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (empty || !data) {
    body = (
      <StateMessage
        icon={Inbox}
        title="Tidak ada data pelanggan untuk kombinasi filter ini."
        description="Ubah periode, wilayah, outlet, gender, atau usia pada filter global untuk membuka slice pelanggan lain."
      />
    )
  } else {
    body = (
      <>
        <ProfileSummaryCards summary={data.summary} />
        <DemographicsSection demographics={data.demographics} />
        <CustomerSegments segments={data.segments} />
        <LocationsSection locations={data.locations} />
        <PreferencesSection preferences={data.preferences} />
        <CustomerBehaviour behaviour={data.behaviour} insights={data.insights} />
        <CustomerTable rows={data.customers} />
      </>
    )
  }

  return (
    <div className="customer-profile">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat profil pelanggan' : 'Profil pelanggan siap'}
      </p>

      <section className="customer-profile__hero">
        <div className="hero-copy">
          <h1>
            Profil Pelanggan
            <Sparkles size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${formatNumber(data.summary.totalCustomers)} pelanggan pada ${data.periodLabel}. Kenali karakteristik, segmentasi, dan pola pelanggan berdasarkan data transaksi serta perilaku mereka.`
              : 'Kenali karakteristik, segmentasi, dan pola pelanggan berdasarkan data transaksi serta perilaku mereka.'}
          </p>
        </div>
      </section>

      {body}

      <footer className="customer-profile__source">
        Sumber Data: aggregate cube synthetic POS, pelanggan, activity, survey, channel, kategori, dan hourly.
      </footer>
    </div>
  )
}
