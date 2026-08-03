import { useEffect, useMemo, useState } from 'react'
import {
  BadgeInfo,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  LineChart,
  PackageCheck,
  RefreshCcw,
  SlidersHorizontal,
  Target,
  TriangleAlert,
  X,
} from 'lucide-react'
import GlassCard from '@/components/common/GlassCard/GlassCard'
import StateMessage from '@/components/common/StateMessage/StateMessage'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton/DashboardSkeleton'
import {
  defaultSalesForecastLocalFilters,
  defaultSalesScenario,
  querySalesForecast,
} from '@/data/salesForecastSelectors'
import type { SalesDetailRow, SalesForecastJson, SalesForecastKpi, SalesForecastLocalFilters, SalesForecastMetric, SalesForecastResult, SalesScenario } from '@/data/salesForecastSelectors'
import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatNumber, formatPercent, formatScore } from '@/data/formatters'
import { useInsights } from '@/hooks/useInsights'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useFilterStore } from '@/store/useFilterStore'
import './index.less'

const kpiIcons = [CircleDollarSign, BarChart3, LineChart, PackageCheck, CalendarDays, Target]

function formatKpi(card: SalesForecastKpi) {
  if (card.display === 'currency') return formatCompactCurrency(Number(card.value))
  if (card.display === 'percent') return formatPercent(Number(card.value))
  if (card.display === 'score') return formatScore(Number(card.value), 2)
  if (card.display === 'number') return formatCompactNumber(Number(card.value))
  return String(card.value)
}

function Kpis({ data }: { data: SalesForecastResult }) {
  return (
    <section className="sales-summary">
      {data.kpis.map((card, index) => {
        const Icon = kpiIcons[index % kpiIcons.length]!
        return (
          <GlassCard interactive={false} className={`sales-kpi sales-kpi--${card.tone}`} key={card.id}>
            <span className="sales-kpi__icon"><Icon size={18} /></span>
            <span className="sales-kpi__label">{card.label}</span>
            <strong>{formatKpi(card)}</strong>
            <small>{card.detail}</small>
          </GlassCard>
        )
      })}
    </section>
  )
}

function MainChart({ data }: { data: SalesForecastResult }) {
  const max = Math.max(...data.chart.map((point) => point.upper ?? point.forecast ?? point.historical ?? 0), 1)
  return (
    <GlassCard interactive={false} className="sales-panel sales-chart-card">
      <div className="sales-panel__head">
        <div><span>Historical + Forecast</span><h2>{data.metricLabel} Forecast</h2></div>
        <small>Forecast dashed, confidence interval berasal dari residual backtest.</small>
      </div>
      <div className="sales-chart">
        {data.chart.map((point, index) => (
          <article key={`${point.date}-${index}`} className={point.isForecast ? 'is-forecast' : 'is-history'} title={`${point.date}`}>
            {point.isForecast && <i className="sales-chart__band" style={{ height: `${(((point.upper ?? 0) - (point.lower ?? 0)) / max) * 100}%`, bottom: `${((point.lower ?? 0) / max) * 100}%` }} />}
            <b style={{ height: `${Math.max(2, (((point.forecast ?? point.historical ?? 0) / max) * 100))}%` }} />
            {index === data.chart.findIndex((row) => row.isForecast) && <em>Forecast Start</em>}
            <small>{point.date.slice(5)}</small>
          </article>
        ))}
      </div>
      <div className="sales-legend">
        <span><i className="history" /> Historical</span>
        <span><i className="forecast" /> Forecast</span>
        <span><i className="band" /> Confidence interval</span>
      </div>
    </GlassCard>
  )
}

function RankingTable({ title, eyebrow, rows }: { title: string; eyebrow: string; rows: SalesForecastResult['products'] }) {
  return (
    <GlassCard interactive={false} className="sales-panel sales-table-card">
      <div className="sales-panel__head"><div><span>{eyebrow}</span><h2>{title}</h2></div></div>
      <div className="sales-table-wrap">
        <table className="sales-table">
          <thead><tr><th>Name</th><th>Revenue</th><th>Orders</th><th>Units</th><th>Growth</th><th>Target</th><th>Accuracy</th><th>Risk</th></tr></thead>
          <tbody>
            {rows.slice(0, 8).map((row) => (
              <tr key={row.id}>
                <td><strong>{row.label}</strong><small>{row.secondary}</small></td>
                <td>{formatCompactCurrency(row.forecastRevenue)}</td>
                <td>{formatCompactNumber(row.forecastOrders)}</td>
                <td>{formatCompactNumber(row.forecastUnits)}</td>
                <td className={row.growth >= 0 ? 'is-positive' : 'is-negative'}>{formatPercent(row.growth)}</td>
                <td>{formatPercent(row.achievement)}</td>
                <td>{formatPercent(row.confidence)}</td>
                <td><em>{row.stockRisk}</em></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function TargetScenario({ data, scenario, setScenario }: { data: SalesForecastResult; scenario: SalesScenario; setScenario: (next: SalesScenario) => void }) {
  const setValue = (key: keyof SalesScenario, value: number) => setScenario({ ...scenario, [key]: value })
  return (
    <div className="sales-grid sales-grid--two">
      <GlassCard interactive={false} className="sales-panel sales-target">
        <div className="sales-panel__head"><div><span>Target Achievement</span><h2>Forecast vs Target</h2></div></div>
        <strong>{formatPercent(data.target.achievement)}</strong>
        <i><b style={{ width: `${Math.min(100, data.target.achievement * 100)}%` }} /></i>
        <dl>
          <div><dt>Forecast</dt><dd>{formatCompactCurrency(data.target.forecastRevenue)}</dd></div>
          <div><dt>Target</dt><dd>{formatCompactCurrency(data.target.targetRevenue)}</dd></div>
          <div><dt>Remaining</dt><dd>{formatCompactCurrency(data.target.remainingRevenue)}</dd></div>
          <div><dt>Daily Needed</dt><dd>{formatCompactCurrency(data.target.dailyRevenueNeeded)}</dd></div>
        </dl>
      </GlassCard>
      <GlassCard interactive={false} className="sales-panel sales-scenario">
        <div className="sales-panel__head"><div><span>Scenario Simulation</span><h2>What-if Forecast</h2></div><small>Tidak mengubah data asli.</small></div>
        {([
          ['marketingBudgetLift', 'Marketing Budget'],
          ['trafficLift', 'Traffic'],
          ['conversionLift', 'Conversion Rate'],
          ['basketLift', 'Average Basket'],
          ['repeatLift', 'Repeat Rate'],
        ] as Array<[keyof SalesScenario, string]>).map(([key, label]) => (
          <label key={key}>{label}<input type="range" min="-0.2" max="0.3" step="0.01" value={scenario[key]} onChange={(event) => setValue(key, Number(event.target.value))} /><span>{formatPercent(scenario[key])}</span></label>
        ))}
        <div className="sales-scenario__result"><span>Scenario Revenue</span><strong>{formatCompactCurrency(data.scenario.forecastRevenue)}</strong><small>Uplift {formatCompactCurrency(data.scenario.upliftRevenue)} - achievement {formatPercent(data.scenario.scenarioAchievement)}</small></div>
      </GlassCard>
    </div>
  )
}

function SeasonalityBacktest({ data }: { data: SalesForecastResult }) {
  return (
    <div className="sales-grid sales-grid--two">
      <GlassCard interactive={false} className="sales-panel sales-season">
        <div className="sales-panel__head"><div><span>Seasonality</span><h2>Daily, Weekly, Monthly Pattern</h2></div></div>
        {data.seasonality.dailyPattern.map((row) => (
          <article key={row.label}><strong>{row.label}</strong><span>{formatPercent(row.share)}</span><i style={{ width: `${row.share * 100}%` }} /></article>
        ))}
        <p>Peak hour {data.seasonality.peakHour}:00 - Peak week {data.seasonality.peakWeek} - Peak month {data.seasonality.peakMonth}.</p>
      </GlassCard>
      <GlassCard interactive={false} className="sales-panel sales-backtest">
        <div className="sales-panel__head"><div><span>Backtest</span><h2>Model Performance</h2></div></div>
        <dl>
          <div><dt>MAE</dt><dd>{formatCompactCurrency(data.backtest.mae)}</dd></div>
          <div><dt>RMSE</dt><dd>{formatCompactCurrency(data.backtest.rmse)}</dd></div>
          <div><dt>MAPE</dt><dd>{formatPercent(data.backtest.mape)}</dd></div>
          <div><dt>WAPE</dt><dd>{formatPercent(data.backtest.wape)}</dd></div>
          <div><dt>Bias</dt><dd>{formatPercent(data.backtest.bias)}</dd></div>
          <div><dt>Accuracy</dt><dd>{formatPercent(data.backtest.accuracy)}</dd></div>
        </dl>
        <p>Selected: {data.backtest.model}. Baseline: {data.backtest.baseline}.</p>
      </GlassCard>
    </div>
  )
}

function InsightsRecommendations({ data }: { data: SalesForecastResult }) {
  return (
    <div className="sales-grid sales-grid--two">
      <GlassCard interactive={false} className="sales-panel sales-notes">
        <div className="sales-panel__head"><div><span>Automatic Insight</span><h2>Forecast Insights</h2></div></div>
        <ol>{data.insights.map((row) => <li key={row}>{row}</li>)}</ol>
      </GlassCard>
      <GlassCard interactive={false} className="sales-panel sales-actions">
        <div className="sales-panel__head"><div><span>Recommendation</span><h2>Recommended Actions</h2></div></div>
        {data.recommendations.map((row) => (
          <article key={row.id}><span>{row.priority}</span><strong>{row.target}</strong><p>{row.evidence}</p><small>{row.action}</small></article>
        ))}
      </GlassCard>
    </div>
  )
}

function DetailTable({ data, onSelect }: { data: SalesForecastResult; onSelect: (row: SalesDetailRow) => void }) {
  return (
    <GlassCard interactive={false} className="sales-panel sales-table-card">
      <div className="sales-panel__head"><div><span>Detail Table</span><h2>Daily Forecast Detail</h2></div><small>Klik row untuk drawer.</small></div>
      <div className="sales-table-wrap">
        <table className="sales-table">
          <thead><tr><th>Date</th><th>Revenue</th><th>Order</th><th>Transaction</th><th>Unit</th><th>Basket</th><th>Lower</th><th>Upper</th><th>Growth</th><th>Confidence</th></tr></thead>
          <tbody>
            {data.detailRows.slice(0, 40).map((row) => (
              <tr key={row.date} onClick={() => onSelect(row)}>
                <td><strong>{row.date}</strong></td>
                <td>{formatCurrency(row.forecastRevenue)}</td>
                <td>{formatNumber(row.forecastOrders)}</td>
                <td>{formatNumber(row.forecastTransactions)}</td>
                <td>{formatNumber(row.forecastUnits)}</td>
                <td>{formatCurrency(row.forecastBasket)}</td>
                <td>{formatCurrency(row.lower)}</td>
                <td>{formatCurrency(row.upper)}</td>
                <td className={row.growth >= 0 ? 'is-positive' : 'is-negative'}>{formatPercent(row.growth)}</td>
                <td>{formatPercent(row.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function Drawer({ row, onClose }: { row: SalesDetailRow | null; onClose: () => void }) {
  if (!row) return null
  return (
    <aside className="sales-drawer" role="dialog" aria-label="Forecast detail drawer">
      <button type="button" onClick={onClose}><X size={16} /></button>
      <span>Forecast Detail</span>
      <h2>{row.date}</h2>
      <dl>
        <div><dt>Forecast</dt><dd>{formatCurrency(row.forecastRevenue)}</dd></div>
        <div><dt>Confidence</dt><dd>{formatPercent(row.confidence)}</dd></div>
        <div><dt>Interval</dt><dd>{formatCurrency(row.lower)} - {formatCurrency(row.upper)}</dd></div>
      </dl>
      <h3>Driver</h3>
      <ul>{row.drivers.map((driver) => <li key={driver}>{driver}</li>)}</ul>
      <h3>Recommendation</h3>
      <p>{row.recommendation}</p>
      <small>Related campaign/product/outlet mengikuti series dan filter aktif pada halaman.</small>
    </aside>
  )
}

export default function SalesForecast() {
  useInsights()
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const filters = useFilterStore((state) => state.filters)
  const [local, setLocalFilters] = useState<SalesForecastLocalFilters>(defaultSalesForecastLocalFilters)
  const [scenario, setScenario] = useState<SalesScenario>(defaultSalesScenario)
  const [payload, setPayload] = useState<SalesForecastJson | null>(null)
  const [payloadError, setPayloadError] = useState<string | null>(null)
  const [drawerRow, setDrawerRow] = useState<SalesDetailRow | null>(null)

  useEffect(() => {
    let active = true
    fetch('/assets/salesForecast.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Sales forecast aggregate gagal dimuat (${response.status})`)
        return response.json() as Promise<SalesForecastJson>
      })
      .then((json) => { if (active) setPayload(json) })
      .catch((fetchError: unknown) => { if (active) setPayloadError(fetchError instanceof Error ? fetchError.message : 'Sales forecast gagal dimuat') })
    return () => { active = false }
  }, [])

  const data = useMemo(() => (payload ? querySalesForecast(payload, filters, local, scenario) : null), [payload, filters, local, scenario])
  const setLocal = <K extends keyof SalesForecastLocalFilters>(key: K, value: SalesForecastLocalFilters[K]) => setLocalFilters((state) => ({ ...state, [key]: value }))

  let body
  if (loading || (!data && !error && !payloadError)) body = <DashboardSkeleton />
  else if (error || payloadError) body = <StateMessage icon={TriangleAlert} tone="danger" title="Data gagal dimuat" description={error ?? payloadError ?? 'Unknown error'} />
  else if (!data) body = <StateMessage icon={TriangleAlert} title="No Forecast" description="Forecast belum tersedia untuk filter aktif." />
  else body = (
    <>
      <Kpis data={data} />
      <MainChart data={data} />
      <div className="sales-grid sales-grid--two">
        <RankingTable title="Top Revenue Outlet" eyebrow="Outlet Forecast" rows={data.rankings.topRevenueOutlet} />
        <RankingTable title="Top Product" eyebrow="Product Forecast" rows={data.rankings.topProduct} />
      </div>
      <div className="sales-grid sales-grid--two">
        <RankingTable title="Channel Forecast" eyebrow="Channel Mix" rows={data.channels} />
        <RankingTable title="Campaign Forecast" eyebrow="Campaign Impact" rows={data.campaigns} />
      </div>
      <TargetScenario data={data} scenario={scenario} setScenario={setScenario} />
      <SeasonalityBacktest data={data} />
      <InsightsRecommendations data={data} />
      <DetailTable data={data} onSelect={setDrawerRow} />
      <Drawer row={drawerRow} onClose={() => setDrawerRow(null)} />
    </>
  )

  return (
    <div className="sales-forecast">
      <section className="sales-forecast__hero">
        <div className="hero-copy">
          <span>Predictive Analytics</span>
          <h1>Sales Forecast <LineChart size={22} /></h1>
          <p>{data ? `${data.selectedSeries.label} - ${local.horizon} hari - metric ${data.metricLabel}. Forecast mencakup revenue, order, transaction, unit, basket, gross profit, conversion, target, dan scenario simulation.` : 'Forecast performa penjualan masa depan berbasis histori transaksi dan aggregate layer.'}</p>
        </div>
        <div className="sales-forecast__badge"><BadgeInfo size={16} /><span>Statistical Forecast - Reproducible</span></div>
      </section>

      {data && (
        <section className="sales-forecast__filters">
          <div className="sales-forecast__filters-title"><SlidersHorizontal size={16} /><span>Forecast Controls</span></div>
          <select value={local.horizon} onChange={(event) => setLocal('horizon', Number(event.target.value) as SalesForecastLocalFilters['horizon'])}>{[7, 30, 90, 180, 365].map((day) => <option key={day} value={day}>{day} Hari</option>)}</select>
          <select value={local.metric} onChange={(event) => setLocal('metric', event.target.value as SalesForecastMetric)}>{data.meta.metrics.map((metric) => <option key={metric} value={metric}>{data.available.metricLabels[metric]}</option>)}</select>
          <select value={local.groupBy} onChange={(event) => setLocal('groupBy', event.target.value as SalesForecastLocalFilters['groupBy'])}>{['overall', 'outlet', 'region', 'city', 'category', 'product', 'channel', 'campaign', 'membership', 'segment'].map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={local.channel} onChange={(event) => setLocal('channel', event.target.value)}><option value="all">Semua Channel</option>{data.available.channels.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={local.campaign} onChange={(event) => setLocal('campaign', event.target.value)}><option value="all">Semua Campaign</option>{data.available.campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select value={local.category} onChange={(event) => setLocal('category', event.target.value)}><option value="all">Semua Category</option>{data.available.categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={local.product} onChange={(event) => setLocal('product', event.target.value)}><option value="all">Semua Product</option>{data.available.products.filter((item) => local.category === 'all' || item.category === local.category).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select value={local.membership} onChange={(event) => setLocal('membership', event.target.value)}><option value="all">Semua Membership</option>{data.available.memberships.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={local.segment} onChange={(event) => setLocal('segment', event.target.value)}><option value="all">Semua Segment</option>{data.available.segments.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <label>Search<input value={local.search} onChange={(event) => setLocal('search', event.target.value)} /></label>
          <button type="button" onClick={() => { setLocalFilters(defaultSalesForecastLocalFilters); setScenario(defaultSalesScenario) }}><RefreshCcw size={15} /> Reset</button>
        </section>
      )}

      {body}
      {data && <footer className="sales-forecast__source">Source: {data.meta.source}. {data.limitations[0]}</footer>}
    </div>
  )
}
