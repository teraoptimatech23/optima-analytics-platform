import GlassCard from '@/components/common/GlassCard/GlassCard'
import Skeleton from '@/components/common/Skeleton/Skeleton'
import './DashboardSkeleton.less'

const KPI_COUNT = 4
const INSIGHT_COUNT = 4
const ROW_COUNT = 5

function CardRows({ rows = ROW_COUNT }: { rows?: number }) {
  return (
    <div className="skeleton-card__rows">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-card__row" key={index}>
          <Skeleton width={28} height={28} radius={14} />
          <Skeleton width={`${58 + (index % 3) * 12}%`} height={10} />
          <Skeleton width={34} height={10} />
        </div>
      ))}
    </div>
  )
}

/** Mirrors the real grid so the page doesn't jump when data lands. */
export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-busy="true">
      <section className="dashboard-page__kpis">
        {Array.from({ length: KPI_COUNT }, (_, index) => (
          <GlassCard className="skeleton-card skeleton-card--kpi" interactive={false} compact key={index}>
            <Skeleton width={44} height={44} radius={22} />
            <div className="skeleton-card__stack">
              <Skeleton width="62%" height={10} />
              <Skeleton width="42%" height={24} radius={8} />
              <Skeleton width="54%" height={9} />
            </div>
          </GlassCard>
        ))}
      </section>

      <section className="dashboard-page__insights">
        {Array.from({ length: INSIGHT_COUNT }, (_, index) => (
          <GlassCard className="skeleton-card" interactive={false} key={index}>
            <div className="skeleton-card__head">
              <Skeleton width={30} height={30} radius={15} />
              <Skeleton width="46%" height={12} />
            </div>
            <CardRows />
          </GlassCard>
        ))}
      </section>

      <section className="dashboard-page__analysis">
        {Array.from({ length: 2 }, (_, index) => (
          <GlassCard className="skeleton-card" interactive={false} key={index}>
            <div className="skeleton-card__head">
              <Skeleton width={30} height={30} radius={15} />
              <Skeleton width="40%" height={12} />
            </div>
            <CardRows rows={4} />
          </GlassCard>
        ))}
        <GlassCard className="skeleton-card kpi-table-card" interactive={false}>
          <div className="skeleton-card__head">
            <Skeleton width={30} height={30} radius={15} />
            <Skeleton width="28%" height={12} />
          </div>
          <CardRows rows={6} />
        </GlassCard>
      </section>
    </div>
  )
}
