import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  Activity,
  AlertTriangle,
  BadgeInfo,
  BarChart3,
  CalendarDays,
  Info,
  LineChart,
  PackageCheck,
  RefreshCcw,
  SlidersHorizontal,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultDemandForecastLocalFilters,
  queryDemandForecast,
} from '@/data/demandForecastSelectors'
import type { DemandForecastEntityRow, DemandForecastKpi, DemandForecastLocalFilters, DemandForecastResult } from '@/data/demandForecastSelectors'
import { formatCompactNumber, formatNumber, formatPercent } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const icons = [PackageCheck, Activity, CalendarDays, BarChart3, TrendingUp]

function formatKpi(card: DemandForecastKpi) {
  if (card.display === 'percent' && typeof card.value === 'number') return formatPercent(card.value)
  if (card.display === 'number' && typeof card.value === 'number') return formatCompactNumber(card.value)
  return String(card.value)
}

function DemandKpis({ data }: { data: DemandForecastResult }) {
  return (
    <section className="demand-summary" aria-label="Demand forecast KPI summary">
      {data.kpis.map((card, index) => {
        const Icon = icons[index % icons.length]!
        return (
          <GlassCard interactive={false} className={`demand-kpi demand-kpi--${card.tone}`} key={card.id}>
            <span className="demand-kpi__icon"><Icon size={18} /></span>
            <span className="demand-kpi__label">{card.label}</span>
            <strong>{formatKpi(card)}</strong>
            <small>{card.detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function ForecastOverview({ data }: { data: DemandForecastResult }) {
  const max = Math.max(...data.overview.map((row) => row.actual ?? row.upper80 ?? row.point), 1)
  return (
    <GlassCard interactive={false} className="demand-panel demand-overview">
      <div className="demand-panel__head">
        <div>
          <span>Actual · Backtest · Forecast</span>
          <h2>Demand Forecast Overview</h2>
        </div>
        <small>Interval adalah empirical prediction interval dari residual backtest, bukan kepastian.</small>
      </div>
      <div className="demand-chart" aria-label="Demand forecast overview chart">
        {data.overview.map((row, index) => (
          <article key={`${row.date}-${index}-${row.point || row.backtest || row.actual || 0}`} title={`${row.date} · actual ${row.actual ?? '-'} · forecast ${row.point || row.backtest || '-'} · interval ${row.lower80}-${row.upper80}`}>
            <i className="demand-chart__interval" style={{ height: `${Math.max(0, ((row.upper80 - row.lower80) / max) * 100)}%`, bottom: `${(row.lower80 / max) * 100}%` }} />
            {row.actual !== undefined && <b className="demand-chart__actual" style={{ height: `${Math.max(3, (row.actual / max) * 100)}%` }} />}
            {row.backtest !== undefined && <b className="demand-chart__backtest" style={{ height: `${Math.max(3, (row.backtest / max) * 100)}%` }} />}
            {row.point > 0 && <b className="demand-chart__forecast" style={{ height: `${Math.max(3, (row.point / max) * 100)}%` }} />}
            <small>{row.date.slice(5)}</small>
          </article>
        ))}
      </div>
      <div className="demand-legend">
        <span><i className="actual" /> Actual</span>
        <span><i className="backtest" /> Backtest Forecast</span>
        <span><i className="forecast" /> Future Forecast</span>
        <span><i className="interval" /> 80% Interval</span>
      </div>
    </GlassCard>
  )
}

function EntityTable({ title, eyebrow, rows }: { title: string; eyebrow: string; rows: DemandForecastEntityRow[] }) {
  return (
    <GlassCard interactive={false} className="demand-panel demand-table-card">
      <div className="demand-panel__head">
        <div><span>{eyebrow}</span><h2>{title}</h2></div>
      </div>
      <div className="demand-table-wrap">
        <table className="demand-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Forecast Units</th>
              <th>Daily Avg</th>
              <th>Growth</th>
              <th>Peak</th>
              <th>Interval</th>
              <th>Model</th>
              <th>WAPE</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((row) => (
              <tr key={row.id}>
                <td><strong>{row.label}</strong><span>{row.secondary}</span></td>
                <td>{formatNumber(row.forecastDemand)}</td>
                <td>{formatNumber(row.dailyAverage)}</td>
                <td className={row.growth >= 0 ? 'is-positive' : 'is-negative'}>{formatPercent(row.growth)}</td>
                <td>{row.peakDate}</td>
                <td>{row.interval}</td>
                <td>{row.model}</td>
                <td>{formatPercent(row.wape)}</td>
                <td><em>{row.riskStatus}</em></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function ModelPerformance({ data }: { data: DemandForecastResult }) {
  const max = Math.max(...data.modelRows.map((row) => row.value), 1)
  return (
    <GlassCard interactive={false} className="demand-panel demand-model">
      <div className="demand-panel__head">
        <div><span>Rolling-Origin Backtest</span><h2>Model Performance</h2></div>
        <small>Selected model dipakai hanya jika mengalahkan baseline WAPE; jika tidak, fallback ke seasonal naive.</small>
      </div>
      <div className="demand-model__bars">
        {data.modelRows.map((row) => (
          <article key={row.label}>
            <div><strong>{row.label}</strong><span>{row.model}</span></div>
            <b>{row.label === 'MAE' ? formatNumber(row.value) : formatPercent(row.value)}</b>
            <i style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
          </article>
        ))}
      </div>
      <p>
        Training window berakhir sebelum validation window pada setiap fold. Backtest period berada di histori aktual, sehingga forecast masa depan tidak ikut memilih model.
      </p>
    </GlassCard>
  )
}

function SeasonalityAndRisk({ data }: { data: DemandForecastResult }) {
  return (
    <div className="demand-grid demand-grid--two">
      <GlassCard interactive={false} className="demand-panel demand-season">
        <div className="demand-panel__head"><div><span>Demand Drivers</span><h2>Pola yang Terkait Forecast</h2></div></div>
        <div className="demand-season__rows">
          {data.daypartRows.map((row) => (
            <article key={row.label}><strong>{row.label}</strong><span>{formatPercent(row.share)}</span><i style={{ width: `${row.share * 100}%` }} /></article>
          ))}
          {data.channelShareRows.slice(0, 4).map((row) => (
            <article key={row.label}><strong>{row.label}</strong><span>{formatPercent(row.share)}</span><i style={{ width: `${row.share * 100}%` }} /></article>
          ))}
        </div>
      </GlassCard>
      <GlassCard interactive={false} className="demand-panel demand-risks">
        <div className="demand-panel__head"><div><span>Forecast Risks</span><h2>Forecast Risks</h2></div></div>
        <div className="demand-risks__list">
          {data.risks.map((risk) => (
            <article className={`demand-risk demand-risk--${risk.severity}`} key={`${risk.type}-${risk.affectedEntity}`}>
              <strong>{risk.type}</strong>
              <span>{risk.affectedEntity}</span>
              <p>{risk.evidence}</p>
              <small>{risk.suggestedAction}</small>
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function ForecastDetail({ data, setLocalFilters }: { data: DemandForecastResult; setLocalFilters: Dispatch<SetStateAction<DemandForecastLocalFilters>> }) {
  return (
    <GlassCard interactive={false} className="demand-panel demand-table-card">
      <div className="demand-panel__head">
        <div><span>Forecast Explorer</span><h2>Demand Forecast Detail</h2></div>
        <small>{data.pagination.total} rows · page {data.pagination.page}/{data.pagination.pages}</small>
      </div>
      <div className="demand-table-wrap">
        <table className="demand-table">
          <thead>
            <tr>
              <th>Date/Period</th>
              <th>Series</th>
              <th>Point Forecast</th>
              <th>Lower</th>
              <th>Upper</th>
              <th>Comparable</th>
              <th>Growth</th>
              <th>Model</th>
              <th>Reliability</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {data.detailRows.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td><strong>{row.label}</strong></td>
                <td>{formatNumber(row.point)}</td>
                <td>{formatNumber(row.lower)}</td>
                <td>{formatNumber(row.upper)}</td>
                <td>{formatNumber(row.historicalComparable)}</td>
                <td className={row.growth >= 0 ? 'is-positive' : 'is-negative'}>{formatPercent(row.growth)}</td>
                <td>{row.model}</td>
                <td>{row.reliability}</td>
                <td><em>{row.riskStatus}</em></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="demand-pagination">
        <button type="button" disabled={data.pagination.page <= 1} onClick={() => setLocalFilters((state) => ({ ...state, tablePage: Math.max(1, state.tablePage - 1) }))}>Previous</button>
        <span>{data.pagination.page} / {data.pagination.pages}</span>
        <button type="button" disabled={data.pagination.page >= data.pagination.pages} onClick={() => setLocalFilters((state) => ({ ...state, tablePage: Math.min(data.pagination.pages, state.tablePage + 1) }))}>Next</button>
      </div>
    </GlassCard>
  )
}

export default function DemandForecast() {
  useInsights()
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [localFilters, setLocalFilters] = useState<DemandForecastLocalFilters>(defaultDemandForecastLocalFilters)
  const data = useMemo(() => queryDemandForecast(filters, localFilters), [filters, localFilters])
  const setLocal = <K extends keyof DemandForecastLocalFilters>(key: K, value: DemandForecastLocalFilters[K]) => setLocalFilters((state) => ({ ...state, [key]: value, tablePage: key === 'tablePage' ? value as number : 1 }))

  let body
  if (loading) {
    body = <DashboardSkeleton />
  } else if (error) {
    body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error} />
  } else {
    body = (
      <>
        <DemandKpis data={data} />
        <ForecastOverview data={data} />
        <div className="demand-grid demand-grid--two">
          <EntityTable title="Demand by Product" eyebrow="Product Forecast" rows={data.productRows} />
          <EntityTable title="Demand by Category" eyebrow="Category Forecast" rows={data.categoryRows} />
        </div>
        <div className="demand-grid demand-grid--two">
          <EntityTable title="Demand by Outlet" eyebrow="Outlet Forecast" rows={data.outletRows} />
          <EntityTable title="Demand by Channel" eyebrow="Channel Forecast" rows={data.channelRows} />
        </div>
        <div className="demand-grid demand-grid--two">
          <ModelPerformance data={data} />
          <GlassCard interactive={false} className="demand-panel demand-planning">
            <div className="demand-panel__head"><div><span>Inventory Planning</span><h2>Demand Planning Recommendation</h2></div></div>
            <strong>{formatNumber(data.detailRows.reduce((total, row) => total + row.upper, 0))} units</strong>
            <p>Suggested Planning Quantity memakai upper empirical interval pada halaman detail aktif. Ini pendekatan konservatif karena lead time dan inventory stock tidak tersedia.</p>
          </GlassCard>
        </div>
        <SeasonalityAndRisk data={data} />
        <ForecastDetail data={data} setLocalFilters={setLocalFilters} />
      </>
    )
  }

  return (
    <div className="demand-forecast">
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Memuat Demand Forecast' : `${Math.round(data.kpis[0]?.value as number).toLocaleString('id-ID')} forecast units`}
      </p>
      <section className="demand-forecast__hero">
        <div className="hero-copy">
          <span>Predictive Analytics</span>
          <h1>
            Demand Forecast
            <LineChart size={22} strokeWidth={2} />
          </h1>
          <p>
            {data.filterLabel} · Generated: {data.meta.generatedAt}. Prediksi kebutuhan produk dan volume pesanan berdasarkan histori transaksi, pola waktu, outlet, channel, dan kategori produk.
          </p>
        </div>
        <div className="demand-forecast__badge" title="Forecast merupakan estimasi berbasis pola historis dan memiliki tingkat ketidakpastian.">
          <BadgeInfo size={16} />
          <span>Forecast Source: Synthetic Transaction Dataset</span>
          <Info size={14} />
        </div>
      </section>

      <section className="demand-forecast__filters" aria-label="Demand Forecast filters">
        <div className="demand-forecast__filters-title"><SlidersHorizontal size={16} /><span>Forecast Explorer</span></div>
        <select aria-label="Hierarchy level" value={localFilters.level} onChange={(event) => setLocal('level', event.target.value as DemandForecastLocalFilters['level'])}>
          <option value="overall">Total Business</option>
          <option value="category">Product Category</option>
          <option value="product">Product</option>
          <option value="outlet">Outlet</option>
          <option value="channel">Channel</option>
          <option value="region">Region</option>
        </select>
        <select aria-label="Forecast horizon" value={localFilters.horizon} onChange={(event) => setLocal('horizon', Number(event.target.value))}>
          {[7, 14, 30, 60, 90].map((days) => <option key={days} value={days}>{days} Hari</option>)}
        </select>
        <select aria-label="Granularity" value={localFilters.granularity} onChange={(event) => setLocal('granularity', event.target.value as DemandForecastLocalFilters['granularity'])}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <select aria-label="Category" value={localFilters.category} onChange={(event) => setLocal('category', event.target.value)}>
          <option value="all">Semua Kategori</option>
          {data.available.categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select aria-label="Product" value={localFilters.product} onChange={(event) => setLocal('product', event.target.value)}>
          <option value="all">Semua Produk</option>
          {data.available.products.filter((product) => localFilters.category === 'all' || product.category === localFilters.category).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
        <select aria-label="Outlet" value={localFilters.outlet} onChange={(event) => setLocal('outlet', event.target.value)}>
          <option value="all">Semua Outlet</option>
          {data.available.outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
        </select>
        <select aria-label="Channel" value={localFilters.channel} onChange={(event) => setLocal('channel', event.target.value)}>
          <option value="all">Semua Channel</option>
          {data.available.channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
        </select>
        <label>Search<input aria-label="Search forecast detail" value={localFilters.search} onChange={(event) => setLocal('search', event.target.value)} /></label>
        <button type="button" aria-label="Reset forecast filters" onClick={() => setLocalFilters(defaultDemandForecastLocalFilters)}><RefreshCcw size={15} /> Reset</button>
      </section>

      {body}

      <footer className="demand-forecast__source">
        Forecast metric: Units Sold. Baseline: seasonal naive. Candidate: naive, moving average, exponential smoothing, trend-seasonal regression. No annual seasonality is inferred because history is only {data.meta.historyDays} days.
      </footer>
    </div>
  )
}
