import { UsersRound } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CustomerSegmentRow } from '@/data/customerProfileSelectors'
import { formatClv, formatCurrency, formatFrequency, formatNumber, formatPercent } from '@/data/formatters'

interface CustomerSegmentsProps {
  segments: CustomerSegmentRow[]
}

export default function CustomerSegments({ segments }: CustomerSegmentsProps) {
  return (
    <GlassCard interactive={false} className="profile-panel customer-segments">
      <SectionTitle icon={UsersRound} title="Segmentasi Pelanggan" subtitle="Berdasarkan segmentasi RFM synthetic dataset" />
      <div className="customer-segments__grid">
        {segments.map((segment) => (
          <article className={`segment-card segment-card--${segment.tone}`} key={segment.id}>
            <header>
              <span className="segment-card__dot" />
              <div>
                <strong>{segment.label}</strong>
                <p>{segment.description}</p>
              </div>
              <b>{formatPercent(segment.share, 0)}</b>
            </header>
            <ProgressBar value={segment.share * 100} tone={segment.tone} size="sm" />
            <dl>
              <div><dt>Pelanggan</dt><dd>{formatNumber(segment.count)}</dd></div>
              <div><dt>Frequency</dt><dd>{formatFrequency(segment.avgFrequency)}</dd></div>
              <div><dt>Avg Basket</dt><dd>{formatCurrency(segment.avgBasket)}</dd></div>
              <div><dt>Repeat</dt><dd>{formatPercent(segment.repeatRate)}</dd></div>
              <div><dt>CLV</dt><dd>{formatClv(segment.clv)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}
