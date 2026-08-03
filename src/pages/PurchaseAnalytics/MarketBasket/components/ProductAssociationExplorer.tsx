import { Compass } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import SectionTitle from '@/components/common/SectionTitle/SectionTitle'
import type { MarketBasketInsights, MarketBasketLocalFilters } from '@/data/marketBasketSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent } from '@/data/formatters'

export default function ProductAssociationExplorer({
  data,
  localFilters,
  setLocalFilters,
}: {
  data: MarketBasketInsights
  localFilters: MarketBasketLocalFilters
  setLocalFilters: React.Dispatch<React.SetStateAction<MarketBasketLocalFilters>>
}) {
  const selectedId = localFilters.selectedProduct === 'all' ? data.products[0]?.productId : localFilters.selectedProduct
  const product = data.products.find((row) => row.productId === selectedId) ?? data.products[0]
  return (
    <GlassCard interactive={false} className="market-panel">
      <div className="market-panel__head">
        <SectionTitle icon={Compass} title="Product Association Explorer" subtitle="Pilih produk untuk membaca related products dan cross-sell context" />
        <select aria-label="Selected product explorer" value={selectedId ?? 'all'} onChange={(event) => setLocalFilters((state) => ({ ...state, selectedProduct: event.target.value }))}>
          {data.products.map((row) => <option key={row.productId} value={row.productId}>{row.productName}</option>)}
        </select>
      </div>
      {product && (
        <>
          <div className="market-product-stats">
            <article><span>Product Tx</span><strong>{formatCompactNumber(product.transactionCount)}</strong></article>
            <article><span>Support</span><strong>{formatPercent(product.support)}</strong></article>
            <article><span>Product Revenue</span><strong>{formatCompactCurrency(product.revenue)}</strong></article>
            <article><span>Avg Basket Included</span><strong>{formatCompactCurrency(product.averageBasket)}</strong></article>
          </div>
          <div className="market-related-list">
            {product.relatedProducts.map((row) => (
              <article key={row.productId}>
                <strong>{row.productName}</strong>
                <span>{formatCompactNumber(row.pairCount)} pair tx · support {formatPercent(row.support)}</span>
                <small>{product.productName} → {row.productName}: {formatPercent(row.confidenceFromSelected)} · reverse {formatPercent(row.confidenceToSelected)} · lift {row.lift.toFixed(2).replace('.', ',')}x</small>
              </article>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  )
}
