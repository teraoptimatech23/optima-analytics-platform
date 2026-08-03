import { BarChart3, CircleDollarSign, Clock3 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { DistributionRow, RfmSegmentRow } from '@/data/purchaseBehaviourSelectors'
import { formatClv, formatFrequency, formatNumber, formatPercent } from '@/data/formatters'

function DistributionBars({ rows }: { rows: DistributionRow[] }) {
  return (
    <div className="purchase-bars">
      {rows.map((row, index) => (
        <div className="purchase-bars__row" key={row.label}>
          <span>{row.label}</span><strong>{formatPercent(row.share, 0)}</strong>
          <ProgressBar value={row.share * 100} tone={index % 2 ? 'purple' : 'blue'} size="sm" />
          <small>{formatNumber(row.count)} pelanggan</small>
        </div>
      ))}
    </div>
  )
}

export default function PurchaseDistributions({ frequency, recency, rfm }: { frequency: DistributionRow[]; recency: DistributionRow[]; rfm: RfmSegmentRow[] }) {
  return (
    <section className="purchase-behaviour__grid purchase-behaviour__grid--three">
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={BarChart3} title="Purchase Frequency" subtitle="Distribusi jumlah kunjungan" />
        <DistributionBars rows={frequency} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={Clock3} title="Recency Analysis" subtitle="Jarak sejak transaksi terakhir" tone="orange" />
        <DistributionBars rows={recency} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={CircleDollarSign} title="RFM Segmentation" subtitle="Recency, frequency, monetary" tone="purple" />
        <div className="rfm-list">
          {rfm.slice(0, 7).map((row) => (
            <article key={row.id}>
              <header><strong>{row.label}</strong><b>{formatPercent(row.share, 0)}</b></header>
              <small>{formatNumber(row.customers)} pelanggan · {formatFrequency(row.avgFrequency)} · {formatClv(row.clv)}</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
