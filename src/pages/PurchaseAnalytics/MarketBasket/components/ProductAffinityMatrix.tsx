import { Grid3X3 } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MarketBasketInsights, MarketBasketLocalFilters, ProductPair } from '@/data/marketBasketSelectors'
import { formatPercent } from '@/data/formatters'

function valueFor(pair: ProductPair | undefined, metric: MarketBasketLocalFilters['matrixMetric']) {
  if (!pair) return 0
  if (metric === 'pairCount') return pair.transactionCount
  if (metric === 'support') return pair.support
  if (metric === 'confidence') return Math.max(pair.confidenceAToB, pair.confidenceBToA)
  return pair.lift
}

function labelFor(value: number, metric: MarketBasketLocalFilters['matrixMetric']) {
  if (metric === 'pairCount') return Math.round(value).toLocaleString('id-ID')
  if (metric === 'lift') return `${value.toFixed(2).replace('.', ',')}x`
  return formatPercent(value)
}

export default function ProductAffinityMatrix({
  data,
  localFilters,
  setLocalFilters,
}: {
  data: MarketBasketInsights
  localFilters: MarketBasketLocalFilters
  setLocalFilters: React.Dispatch<React.SetStateAction<MarketBasketLocalFilters>>
}) {
  const products = data.products.slice(0, 10)
  const max = Math.max(1, ...data.pairs.map((pair) => valueFor(pair, localFilters.matrixMetric)))
  return (
    <GlassCard interactive={false} className="market-panel">
      <div className="market-panel__head">
        <SectionTitle icon={Grid3X3} title="Product Affinity Matrix" subtitle="Top products only agar heatmap tetap terbaca" />
        <select aria-label="Matrix metric" value={localFilters.matrixMetric} onChange={(event) => setLocalFilters((state) => ({ ...state, matrixMetric: event.target.value as MarketBasketLocalFilters['matrixMetric'] }))}>
          <option value="lift">Lift</option>
          <option value="support">Support</option>
          <option value="confidence">Confidence</option>
          <option value="pairCount">Pair Count</option>
        </select>
      </div>
      <div className="market-matrix-wrap">
        <div className="market-matrix" style={{ gridTemplateColumns: `150px repeat(${products.length}, minmax(76px, 1fr))` }}>
          <span />
          {products.map((product) => <b key={product.productId}>{product.productName}</b>)}
          {products.map((row) => (
            <div className="market-matrix__row" key={row.productId} style={{ display: 'contents' }}>
              <b>{row.productName}</b>
              {products.map((col) => {
                const pair = data.pairs.find((item) => item.id === [row.productId, col.productId].sort().join('|'))
                const value = row.productId === col.productId ? 0 : valueFor(pair, localFilters.matrixMetric)
                return <span key={`${row.productId}-${col.productId}`} title={`${row.productName} + ${col.productName}: ${labelFor(value, localFilters.matrixMetric)}`} style={{ opacity: row.productId === col.productId ? 0.22 : 0.35 + Math.min(0.65, value / max) }}>{row.productId === col.productId ? '—' : labelFor(value, localFilters.matrixMetric)}</span>
              })}
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
