import { useMemo, useState } from 'react'
import { BadgeInfo, Info, Inbox, PackageSearch, RefreshCcw, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import { defaultMarketBasketLocalFilters, queryMarketBasket } from '@/data/marketBasketSelectors'
import type { MarketBasketLocalFilters } from '@/data/marketBasketSelectors'
import { formatCompactCurrency, formatCompactNumber, formatPercent } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import AssociationRuleTable from './components/AssociationRuleTable'
import BasketBreakdowns from './components/BasketBreakdowns'
import BasketComposition from './components/BasketComposition'
import BundleAndCrossSell from './components/BundleAndCrossSell'
import MarketBasketInsightsCard from './components/MarketBasketInsightsCard'
import MarketBasketSummaryCards from './components/MarketBasketSummaryCards'
import ProductAffinityMatrix from './components/ProductAffinityMatrix'
import ProductAssociationExplorer from './components/ProductAssociationExplorer'
import TopProductCombinations from './components/TopProductCombinations'
import './index.less'

export default function MarketBasket() {
  useInsights()
  const cube = useDashboardStore((state) => state.cube)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<MarketBasketLocalFilters>(defaultMarketBasketLocalFilters)
  const data = useMemo(() => (cube ? queryMarketBasket(cube, filters, localFilters) : null), [cube, filters, localFilters])
  const emptyRules = !loading && !error && data !== null && data.rules.length === 0
  const noMultiItem = !loading && !error && data !== null && data.summary.multiItemTransactions === 0
  const setLocal = <K extends keyof MarketBasketLocalFilters>(key: K, value: MarketBasketLocalFilters[K]) => setLocalFilters((state) => ({ ...state, [key]: value }))

  let body
  if (loading || (!data && !error)) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else if (noMultiItem || emptyRules || !data) {
    body = (
      <StateMessage
        icon={Inbox}
        title={noMultiItem ? 'Tidak ada transaksi dengan lebih dari satu produk pada filter aktif.' : 'Tidak ditemukan association rule yang memenuhi threshold untuk kombinasi filter ini.'}
        description="Turunkan minimum support, minimum confidence, minimum lift, perluas periode, pilih semua outlet, atau reset analysis filters."
        action={<button className="market-button" type="button" onClick={() => setLocalFilters(defaultMarketBasketLocalFilters)}>Reset Analysis Filters</button>}
      />
    )
  } else {
    body = (
      <>
        <MarketBasketSummaryCards data={data} />
        <TopProductCombinations data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        <div className="market-basket__split">
          <ProductAssociationExplorer data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
          <ProductAffinityMatrix data={data} localFilters={localFilters} setLocalFilters={setLocalFilters} />
        </div>
        <AssociationRuleTable rules={data.rules} />
        <div className="market-basket__split">
          <BasketComposition rows={data.basketComposition} />
          <MarketBasketInsightsCard insights={data.insights} recommendations={data.recommendations} methodology={data.methodology} />
        </div>
        <BasketBreakdowns data={data} />
        <BundleAndCrossSell data={data} />
      </>
    )
  }

  return (
    <div className="market-basket">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Market Basket Analysis' : data ? `${data.summary.eligibleTransactions} eligible transactions dianalisis` : 'Market Basket Analysis siap'}
      </p>
      <section className="market-basket__hero">
        <div className="hero-copy">
          <span>Purchase Analytics</span>
          <h1>
            Market Basket Analysis
            <PackageSearch size={22} strokeWidth={2} />
          </h1>
          <p>
            {data
              ? `${data.filterLabel} · ${formatCompactNumber(data.summary.eligibleTransactions)} eligible transactions · ${formatPercent(data.summary.multiItemRate)} multi-item rate · ${formatCompactCurrency(data.summary.estimatedOpportunityValue)} estimated opportunity. Temukan produk yang sering dibeli bersama untuk mendukung strategi bundling, cross-sell, promosi, dan optimasi menu.`
              : 'Temukan produk yang sering dibeli bersama untuk mendukung strategi bundling, cross-sell, promosi, dan optimasi menu.'}
          </p>
        </div>
        <div className="market-basket__badge" title="Association menunjukkan pola pembelian bersama dan tidak membuktikan hubungan sebab-akibat.">
          <BadgeInfo size={16} />
          <span>Data Source: Synthetic Transaction Dataset</span>
          <Info size={14} />
        </div>
      </section>

      {data && (
        <section className="market-basket__filters" aria-label="Market Basket local filters">
          <div className="market-basket__filters-title"><SlidersHorizontal size={16} /><span>Analysis filters</span></div>
          <select aria-label="Product filter" value={localFilters.product} onChange={(event) => setLocal('product', event.target.value)}>
            <option value="all">Semua Produk</option>
            {data.availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <select aria-label="Category filter" value={localFilters.category} onChange={(event) => setLocal('category', event.target.value)}>
            <option value="all">Semua Kategori</option>
            {data.availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select aria-label="Customer segment filter" value={localFilters.segment} onChange={(event) => setLocal('segment', event.target.value)}>
            <option value="all">Semua Segment</option>
            {data.availableSegments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
          </select>
          <select aria-label="Channel filter" value={localFilters.channel} onChange={(event) => setLocal('channel', event.target.value)}>
            <option value="all">Semua Channel</option>
            {data.availableChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
          <label>Min Support<input type="number" min="0" max="1" step="0.001" value={localFilters.minimumSupport} onChange={(event) => setLocal('minimumSupport', Number(event.target.value))} /></label>
          <label>Min Confidence<input type="number" min="0" max="1" step="0.01" value={localFilters.minimumConfidence} onChange={(event) => setLocal('minimumConfidence', Number(event.target.value))} /></label>
          <label>Min Lift<input type="number" min="0" step="0.05" value={localFilters.minimumLift} onChange={(event) => setLocal('minimumLift', Number(event.target.value))} /></label>
          <label>Min Pair Count<input type="number" min="1" step="10" value={localFilters.minimumPairCount} onChange={(event) => setLocal('minimumPairCount', Number(event.target.value))} /></label>
          <select aria-label="Rule strength filter" value={localFilters.strength} onChange={(event) => setLocal('strength', event.target.value as MarketBasketLocalFilters['strength'])}>
            <option value="all">Semua Strength</option>
            <option value="very-strong">Very Strong</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
          </select>
          <button type="button" aria-label="Reset analysis filters" onClick={() => setLocalFilters(defaultMarketBasketLocalFilters)}><RefreshCcw size={15} /> Reset Analysis Filters</button>
        </section>
      )}

      {body}

      <footer className="market-basket__source">
        Sumber Data: compact basket fact dari `transactions.csv`, `transaction_items.csv`, `products.csv`, `customers.csv`, dan `outlets.csv`. Support dan confidence dihitung ulang setelah filter, dengan denominator eligible transactions pada filter aktif.
      </footer>
    </div>
  )
}
