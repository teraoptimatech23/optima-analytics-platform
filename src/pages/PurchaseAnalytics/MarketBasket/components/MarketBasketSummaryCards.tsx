import { BadgePercent, Boxes, GitFork, PackageCheck, Scale, ShoppingBasket, Sparkles, TrendingUp } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import type { MarketBasketInsights } from '@/data/marketBasketSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent, formatSignedPercent } from '@/data/formatters'

export default function MarketBasketSummaryCards({ data }: { data: MarketBasketInsights }) {
  const cards = [
    { label: 'Eligible Transactions', value: formatCompactNumber(data.summary.eligibleTransactions), delta: null, icon: ShoppingBasket },
    { label: 'Multi-Item Basket Rate', value: formatPercent(data.summary.multiItemRate), delta: data.deltas.multiItemRate, icon: BadgePercent },
    { label: 'Avg Unique Products', value: data.summary.averageUniqueItems.toFixed(2).replace('.', ','), delta: data.deltas.averageUniqueItems, icon: PackageCheck },
    { label: 'Unique Products', value: formatCompactNumber(data.summary.uniqueProducts), delta: null, icon: Boxes },
    { label: 'Product Pairs', value: formatCompactNumber(data.summary.totalPairs), delta: null, icon: GitFork },
    { label: 'Strong Rules', value: formatCompactNumber(data.summary.strongRules), delta: data.deltas.strongRules, icon: Scale },
    { label: 'Highest Lift Pair', value: `${data.summary.highestLift.toFixed(2).replace('.', ',')}x`, delta: null, icon: TrendingUp, note: data.summary.highestLiftPair ?? '-' },
    { label: 'Estimated Opportunity', value: formatCompactCurrency(data.summary.estimatedOpportunityValue), delta: null, icon: Sparkles },
  ]

  return (
    <section className="market-basket__summary" aria-label="Market Basket KPI summary">
      {cards.map(({ label, value, delta, icon: Icon, note }) => (
        <GlassCard key={label} compact className="market-kpi">
          <span className="market-kpi__icon"><Icon size={18} /></span>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{note ?? (delta === null || delta === undefined ? 'current filter' : `${formatSignedPercent(delta)} vs previous`)}</small>
        </GlassCard>
      ))}
    </section>
  )
}
