import { Boxes, CreditCard, Megaphone, Store } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import ProgressBar from '@/components/common/ProgressBar/ProgressBar'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { CategoryRow, ChannelRow, PurchaseBehaviourInsights } from '@/data/purchaseBehaviourSelectors'
import { formatCurrency, formatNumber, formatPercent } from '@/data/formatters'

function MetricRows({ rows }: { rows: Array<ChannelRow | CategoryRow> }) {
  const max = Math.max(1, ...rows.map((row) => 'transactions' in row ? row.transactions : row.quantity))
  return (
    <div className="metric-row-list">
      {rows.map((row) => {
        const value = 'transactions' in row ? row.transactions : row.quantity
        const revenue = 'transactions' in row ? row.revenue : row.revenue
        return (
          <article key={row.label}>
            <header><strong>{row.label}</strong><b>{formatPercent(row.share, 0)}</b></header>
            <ProgressBar value={value} max={max} tone="cyan" size="sm" />
            <small>{formatNumber(value)} volume · {formatCurrency(revenue)} revenue · basket {formatCurrency(row.basket)}</small>
          </article>
        )
      })}
    </div>
  )
}

export default function PurchaseChannelProduct({ data }: { data: PurchaseBehaviourInsights }) {
  const promoRows = [data.promotion.voucher, data.promotion.nonVoucher, data.promotion.memberPromo, data.promotion.campaignPromo]
  return (
    <section className="purchase-behaviour__grid purchase-behaviour__grid--two">
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={Store} title="Purchase Channel" subtitle="Transactions, revenue, basket, repeat" />
        <MetricRows rows={data.channels} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={Boxes} title="Product Category" subtitle="Dataset berisi kategori, bukan SKU menu" tone="purple" />
        <MetricRows rows={data.categories} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={Megaphone} title="Promotion Analysis" subtitle="Voucher, non-voucher, member promo" tone="orange" />
        <MetricRows rows={promoRows} />
      </GlassCard>
      <GlassCard interactive={false} className="purchase-panel">
        <SectionTitle icon={CreditCard} title="Payment Method" subtitle="Tidak tersedia di aggregate cube" />
        <div className="unavailable-note">
          <strong>Payment method belum ada di insights.json.</strong>
          <p>Cube saat ini menyimpan channel, voucher, member transaction, dan campaign media. Tidak ada dimensi Cash/QRIS/OVO/GoPay/ShopeePay/Debit/Credit Card, jadi bagian ini tidak dibuat dengan angka palsu.</p>
        </div>
      </GlassCard>
    </section>
  )
}
