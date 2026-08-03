import { MapPinned, Split } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { BasketPatternRow, MarketBasketInsights, OutletBasketPattern } from '@/data/marketBasketSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent } from '@/data/formatters'

function PatternList({ title, rows }: { title: string; rows: BasketPatternRow[] }) {
  return (
    <div className="market-pattern-list">
      <strong>{title}</strong>
      {rows.slice(0, 6).map((row) => (
        <article key={row.id}>
          <span>{row.value}</span>
          <b>{row.pairLabel}</b>
          <small>{formatCompactNumber(row.pairCount)} tx · support {formatPercent(row.support)} · confidence {formatPercent(row.confidence)} · lift {row.lift.toFixed(2).replace('.', ',')}x</small>
        </article>
      ))}
    </div>
  )
}

function OutletRows({ rows }: { rows: OutletBasketPattern[] }) {
  return (
    <div className="market-outlet-ranking">
      {rows.slice(0, 8).map((row) => (
        <article key={row.outletId}>
          <div><strong>{row.outletName}</strong><span>{formatCompactNumber(row.eligibleTransactions)} eligible tx</span></div>
          <dl>
            <div><dt>Multi-item</dt><dd>{formatPercent(row.multiItemRate)}</dd></div>
            <div><dt>Avg products</dt><dd>{row.averageItems.toFixed(2).replace('.', ',')}</dd></div>
            <div><dt>Top pair</dt><dd>{row.topPair}</dd></div>
            <div><dt>Lift</dt><dd>{row.topPairLift.toFixed(2).replace('.', ',')}x</dd></div>
            <div><dt>Revenue</dt><dd>{formatCompactCurrency(row.basketRevenue)}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  )
}

export default function BasketBreakdowns({ data }: { data: MarketBasketInsights }) {
  return (
    <div className="market-basket__split">
      <GlassCard interactive={false} className="market-panel">
        <SectionTitle icon={Split} title="Category, Segment, Channel & Time Patterns" subtitle="Context dihitung ulang dari basket aktif" />
        <div className="market-breakdown-grid">
          <PatternList title="Category Affinity" rows={data.categoryAffinity.slice(0, 5).map((row) => ({
            id: row.id,
            dimension: 'category',
            value: `${row.categoryA} + ${row.categoryB}`,
            pairId: row.id,
            pairLabel: `${row.categoryA} + ${row.categoryB}`,
            pairCount: row.pairCount,
            support: row.support,
            confidence: row.confidence,
            lift: row.lift,
            averageBasket: row.pairCount ? row.basketRevenue / row.pairCount : 0,
          }))} />
          <PatternList title="By Segment" rows={data.segmentPatterns} />
          <PatternList title="By Channel" rows={data.channelPatterns} />
          <PatternList title="By Time" rows={data.timePatterns} />
          <PatternList title="Voucher & Promotion" rows={data.voucherPatterns} />
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="market-panel">
        <SectionTitle icon={MapPinned} title="Basket Patterns by Outlet" subtitle="Outlet kecil disaring dengan minimum sample" />
        <OutletRows rows={data.outletPatterns} />
      </GlassCard>
    </div>
  )
}
