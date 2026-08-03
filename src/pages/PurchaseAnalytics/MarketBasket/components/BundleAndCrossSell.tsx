import { Gift, ShoppingCart } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MarketBasketInsights } from '@/data/marketBasketSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent } from '@/data/formatters'

export default function BundleAndCrossSell({ data }: { data: MarketBasketInsights }) {
  return (
    <div className="market-basket__split">
      <GlassCard interactive={false} className="market-panel">
        <SectionTitle icon={Gift} title="Bundle Opportunities" subtitle="Skor internal decision-support, bukan metrik resmi association rule" />
        <div className="market-opportunity-list">
          {data.bundleOpportunities.map((row) => (
            <article key={`${row.productAId}-${row.productBId}`}>
              <span>{row.suggestedBundleType}</span>
              <h3>{row.label}</h3>
              <p>{row.evidence}</p>
              <dl>
                <div><dt>Combined Price</dt><dd>{formatCompactCurrency(row.combinedPrice)}</dd></div>
                <div><dt>Avg Basket</dt><dd>{formatCompactCurrency(row.averageBasket)}</dd></div>
                <div><dt>Dominant Segment</dt><dd>{row.dominantSegment}</dd></div>
                <div><dt>Dominant Channel</dt><dd>{row.dominantChannel}</dd></div>
                <div><dt>Score</dt><dd>{Math.round(row.opportunityScore)}/100</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="market-panel">
        <SectionTitle icon={ShoppingCart} title="Cross-Sell Recommendations" subtitle="Directional confidence A → B" />
        <div className="market-opportunity-list">
          {data.crossSellRecommendations.slice(0, 8).map((row) => (
            <article key={`${row.baseProductId}-${row.recommendedProductId}`}>
              <span>{row.baseProductName} → {row.recommendedProductName}</span>
              <h3>Recommend {row.recommendedProductName}</h3>
              <p>{formatPercent(row.confidence)} confidence dari {formatCompactNumber(row.eligibleTransactions)} eligible base transactions · lift {row.lift.toFixed(2).replace('.', ',')}x.</p>
              <dl>
                <div><dt>Best Segment</dt><dd>{row.bestSegment}</dd></div>
                <div><dt>Best Channel</dt><dd>{row.bestChannel}</dd></div>
                <div><dt>Best Time</dt><dd>{row.bestTime}</dd></div>
                <div><dt>Score</dt><dd>{Math.round(row.opportunityScore)}/100</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
