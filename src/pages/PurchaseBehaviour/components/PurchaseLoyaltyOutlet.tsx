import { BadgeCheck, MapPin, UserRound } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { BehaviourSegmentRow, DistributionRow, OutletBehaviourRow, PurchaseBehaviourInsights } from '@/data/purchaseBehaviourSelectors'
import { formatClv, formatCurrency, formatFrequency, formatNumber, formatPercent, formatScore } from '@/data/formatters'

function SegmentCards({ rows }: { rows: BehaviourSegmentRow[] }) {
  return (
    <div className="behaviour-segment-list">
      {rows.map((row) => (
        <article key={row.segment}>
          <header><strong>{row.segment}</strong><b>{formatNumber(row.customers)}</b></header>
          <small>{formatFrequency(row.frequency)} · basket {formatCurrency(row.basket)} · CLV {formatClv(row.clv)}</small>
          <ProgressBar value={row.repeatRate * 100} tone="blue" size="sm" />
        </article>
      ))}
    </div>
  )
}

function ChurnRows({ rows }: { rows: DistributionRow[] }) {
  return (
    <div className="churn-list">
      {rows.map((row) => (
        <article key={row.label}>
          <span>{row.label}</span><strong>{formatPercent(row.share)}</strong>
          <ProgressBar value={row.share * 100} tone={row.label.includes('Risk') || row.label.includes('Lost') ? 'orange' : 'green'} size="sm" />
        </article>
      ))}
    </div>
  )
}

export default function PurchaseLoyaltyOutlet({ data }: { data: PurchaseBehaviourInsights }) {
  return (
    <section className="purchase-behaviour__grid purchase-behaviour__grid--three">
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={BadgeCheck} title="Loyalty Analysis" subtitle="Member vs non-member" />
        <SegmentCards rows={[data.loyalty.member, data.loyalty.nonMember]} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={UserRound} title="Churn Analysis" subtitle="Threshold berbasis recency" tone="orange" />
        <ChurnRows rows={data.churn} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={UserRound} title="Behaviour by Segment" subtitle="Customer segment aggregate" tone="purple" />
        <SegmentCards rows={data.behaviourSegments.slice(0, 6)} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel purchase-outlet-card">
        <SectionTitle icon={MapPin} title="Behaviour by Outlet" subtitle="Revenue, basket, repeat, waiting time" tone="cyan" />
        <div className="outlet-ranking">
          {data.outlets.slice(0, 8).map((outlet: OutletBehaviourRow, index) => (
            <article key={outlet.id}>
              <span>{index + 1}</span>
              <div>
                <header><strong>{outlet.label}</strong><b>{formatCurrency(outlet.revenue)}</b></header>
                <small>{formatFrequency(outlet.frequency)} · basket {formatCurrency(outlet.basket)} · repeat {formatPercent(outlet.repeatRate)} · wait {formatScore(outlet.waitingTime, 1)}m</small>
                <ProgressBar value={outlet.revenue} max={Math.max(1, ...data.outlets.map((row) => row.revenue))} tone="cyan" size="sm" />
              </div>
            </article>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
