import { Layers3 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { BasketComposition as BasketCompositionRow } from '@/data/marketBasketSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent } from '@/data/formatters'

export default function BasketComposition({ rows }: { rows: BasketCompositionRow[] }) {
  return (
    <GlassCard interactive={false} className="market-panel">
      <SectionTitle icon={Layers3} title="Basket Composition" subtitle="Bucket memakai unique product count, bukan quantity unit" />
      <div className="market-composition">
        {rows.map((row) => (
          <article key={row.bucket}>
            <div><strong>{row.bucket}</strong><span>{formatCompactNumber(row.transactionCount)} tx · {formatPercent(row.transactionShare)}</span></div>
            <i><b style={{ width: `${Math.min(100, row.transactionShare * 100)}%` }} /></i>
            <dl>
              <div><dt>Revenue Share</dt><dd>{formatPercent(row.revenueShare)}</dd></div>
              <div><dt>Avg Basket</dt><dd>{formatCompactCurrency(row.averageBasket)}</dd></div>
              <div><dt>Voucher Rate</dt><dd>{formatPercent(row.voucherRate)}</dd></div>
              <div><dt>Member Rate</dt><dd>{formatPercent(row.memberRate)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}
