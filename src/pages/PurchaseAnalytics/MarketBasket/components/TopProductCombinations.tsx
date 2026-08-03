import { ArrowDownUp, Trophy } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MarketBasketInsights, MarketBasketLocalFilters } from '@/data/marketBasketSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent } from '@/data/formatters'

export default function TopProductCombinations({
  data,
  localFilters,
  setLocalFilters,
}: {
  data: MarketBasketInsights
  localFilters: MarketBasketLocalFilters
  setLocalFilters: React.Dispatch<React.SetStateAction<MarketBasketLocalFilters>>
}) {
  return (
    <GlassCard interactive={false} className="market-panel">
      <div className="market-panel__head">
        <SectionTitle icon={Trophy} title="Top Product Combinations" subtitle="Pair tidak berarah; confidence ditampilkan dua arah" />
        <label className="market-inline-control">
          <ArrowDownUp size={15} />
          <select aria-label="Ranking metric" value={localFilters.rankingMetric} onChange={(event) => setLocalFilters((state) => ({ ...state, rankingMetric: event.target.value as MarketBasketLocalFilters['rankingMetric'] }))}>
            <option value="opportunityScore">Estimated Opportunity</option>
            <option value="pairCount">Pair Frequency</option>
            <option value="support">Support</option>
            <option value="confidence">Confidence</option>
            <option value="lift">Lift</option>
            <option value="combinedRevenue">Combined Revenue</option>
          </select>
        </label>
      </div>
      <div className="market-combo-grid">
        {data.pairs.slice(0, 8).map((pair, index) => (
          <article key={pair.id}>
            <span>#{index + 1} · {pair.strength}</span>
            <h3>{pair.productAName} + {pair.productBName}</h3>
            <dl>
              <div><dt>Pair Tx</dt><dd>{formatCompactNumber(pair.transactionCount)}</dd></div>
              <div><dt>Support</dt><dd>{formatPercent(pair.support)}</dd></div>
              <div><dt>{pair.productAName} → {pair.productBName}</dt><dd>{formatPercent(pair.confidenceAToB)}</dd></div>
              <div><dt>{pair.productBName} → {pair.productAName}</dt><dd>{formatPercent(pair.confidenceBToA)}</dd></div>
              <div><dt>Lift</dt><dd>{pair.lift.toFixed(2).replace('.', ',')}x</dd></div>
              <div><dt>Basket Revenue Containing Pair</dt><dd>{formatCompactCurrency(pair.basketRevenue)}</dd></div>
            </dl>
            <footer>
              <strong>{Math.round(pair.opportunityScore)}/100</strong>
              <small>Avg basket {formatCompactCurrency(pair.averageBasket)}</small>
            </footer>
          </article>
        ))}
      </div>
    </GlassCard>
  )
}
