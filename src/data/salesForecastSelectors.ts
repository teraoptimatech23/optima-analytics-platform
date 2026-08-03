import type { AppliedFilters } from '@/data/types'

export type SalesForecastMetric = 'revenue' | 'orders' | 'transactions' | 'units' | 'averageBasket' | 'grossProfit' | 'conversion'
export type SalesForecastHorizon = 7 | 30 | 90 | 180 | 365
export type SalesForecastGroupBy = 'overall' | 'outlet' | 'region' | 'city' | 'category' | 'product' | 'channel' | 'campaign' | 'membership' | 'segment'

export interface SalesForecastLocalFilters {
  horizon: SalesForecastHorizon
  metric: SalesForecastMetric
  groupBy: SalesForecastGroupBy
  seriesId: string
  channel: string
  campaign: string
  membership: string
  segment: string
  product: string
  category: string
  search: string
}

export interface SalesScenario {
  marketingBudgetLift: number
  trafficLift: number
  conversionLift: number
  basketLift: number
  repeatLift: number
}

export const defaultSalesForecastLocalFilters: SalesForecastLocalFilters = {
  horizon: 30,
  metric: 'revenue',
  groupBy: 'overall',
  seriesId: 'overall:overall',
  channel: 'all',
  campaign: 'all',
  membership: 'all',
  segment: 'all',
  product: 'all',
  category: 'all',
  search: '',
}

export const defaultSalesScenario: SalesScenario = {
  marketingBudgetLift: 0,
  trafficLift: 0,
  conversionLift: 0,
  basketLift: 0,
  repeatLift: 0,
}

interface MetricForecastPayload {
  selectedModel: string
  baselineModel: string
  metrics: {
    mae: number
    rmse: number
    mape: number
    wape: number
    bias: number
    forecastAccuracy: number
    baselineWape: number
    folds: number
    residualP80: number
    residualP95: number
  }
  forecast: Array<[string, number, number, number, number, number]>
  backtest: Array<[string, number, number, number]>
  candidates: Array<{ model: string; wape: number; mae: number; rmse: number; bias: number }>
}

export interface SalesForecastSeries {
  id: string
  level: SalesForecastGroupBy
  label: string
  outletId?: string
  city?: string
  region?: string
  category?: string
  productId?: string
  productName?: string
  channel?: string
  campaignId?: string
  platform?: string
  objective?: string
  membership?: string
  segment?: string
  historyDays: number
  recentComparable: Record<string, number>
  target: { revenue: number; targetGrowth: number; achievement: number; remainingRevenue: number; dailyRevenueNeeded: number }
  confidence: number
  metrics: Record<SalesForecastMetric, MetricForecastPayload>
  history: Array<[string, number, number, number, number, number, number, number]>
  marketing?: { spend: number; value: number }
}

export interface SalesForecastJson {
  meta: {
    source: string
    generatedAt: string
    period: { start: string; end: string }
    historyDays: number
    maxHorizonDays: number
    defaultHorizonDays: number
    metrics: SalesForecastMetric[]
    methodology: string[]
    limitations: string[]
  }
  dims: {
    products: { id: string; name: string; category: string }[]
    outlets: { id: string; name: string; city: string; region: string }[]
    regions: string[]
    cities: string[]
    categories: string[]
    channels: string[]
    campaigns: { id: string; name: string; platform: string; objective: string }[]
    memberships: string[]
    segments: string[]
    metricLabels: Record<SalesForecastMetric, string>
  }
  seasonality: {
    dailyPattern: Array<{ label: string; revenue: number; orders: number; share: number }>
    monthlyPattern: Array<{ month: string; revenue: number; orders: number; share: number }>
    peakHour: number
    peakWeek: string
    peakMonth: string
  }
  series: SalesForecastSeries[]
  summary: { defaultRevenue: number; defaultOrders: number; revenueAccuracy: number; revenueWape: number; selectedRevenueModel: string }
}

export interface SalesForecastKpi {
  id: string
  label: string
  value: number | string
  display: 'currency' | 'number' | 'percent' | 'date' | 'score'
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'red'
}

export interface SalesChartPoint {
  date: string
  historical?: number
  forecast?: number
  lower?: number
  upper?: number
  isForecast: boolean
}

export interface SalesRankingRow {
  id: string
  label: string
  level: SalesForecastGroupBy
  secondary: string
  forecastRevenue: number
  forecastOrders: number
  forecastUnits: number
  grossProfit: number
  growth: number
  achievement: number
  confidence: number
  stockRisk: string
  selectedModel: string
  wape: number
}

export interface SalesDetailRow {
  date: string
  forecastRevenue: number
  forecastOrders: number
  forecastTransactions: number
  forecastUnits: number
  forecastBasket: number
  lower: number
  upper: number
  growth: number
  confidence: number
  drivers: string[]
  recommendation: string
}

export interface SalesForecastResult {
  meta: SalesForecastJson['meta']
  selectedSeries: SalesForecastSeries
  metricLabel: string
  kpis: SalesForecastKpi[]
  chart: SalesChartPoint[]
  rankings: {
    topRevenueOutlet: SalesRankingRow[]
    topGrowthOutlet: SalesRankingRow[]
    topProduct: SalesRankingRow[]
    topRegion: SalesRankingRow[]
    topCampaign: SalesRankingRow[]
    topCategory: SalesRankingRow[]
    activeGroup: SalesRankingRow[]
  }
  products: SalesRankingRow[]
  outlets: SalesRankingRow[]
  channels: SalesRankingRow[]
  campaigns: Array<SalesRankingRow & { spend: number; roas: number; forecastRoas: number }>
  target: {
    forecastRevenue: number
    targetRevenue: number
    achievement: number
    remainingRevenue: number
    dailyRevenueNeeded: number
  }
  scenario: {
    forecastRevenue: number
    upliftRevenue: number
    scenarioAchievement: number
    assumptions: SalesScenario
  }
  seasonality: SalesForecastJson['seasonality']
  drivers: Array<{ label: string; contribution: number; evidence: string }>
  backtest: { mae: number; rmse: number; mape: number; wape: number; bias: number; accuracy: number; model: string; baseline: string }
  insights: string[]
  recommendations: Array<{ id: string; target: string; evidence: string; action: string; priority: 'high' | 'medium' | 'low' }>
  detailRows: SalesDetailRow[]
  available: SalesForecastJson['dims']
  methodology: string[]
  limitations: string[]
}

const safeDivide = (value: number, total: number) => total ? value / total : 0
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

function horizonRows(series: SalesForecastSeries, metric: SalesForecastMetric, horizon: number) {
  return series.metrics[metric].forecast.slice(0, horizon)
}

function forecastTotal(series: SalesForecastSeries, metric: SalesForecastMetric, horizon: number) {
  return sum(horizonRows(series, metric, horizon).map((row) => row[1]))
}

function rowGrowth(series: SalesForecastSeries, metric: SalesForecastMetric, horizon: number) {
  return safeDivide(forecastTotal(series, metric, horizon) - (series.recentComparable[metric] ?? 0), series.recentComparable[metric] ?? 0)
}

function matchesGlobal(series: SalesForecastSeries, filters: AppliedFilters) {
  if (filters.region && series.region && series.region !== filters.region) return false
  if (filters.city && series.city && series.city !== filters.city) return false
  if (filters.outlet && series.outletId && series.outletId !== filters.outlet) return false
  return true
}

function seriesMatchesLocal(series: SalesForecastSeries, local: SalesForecastLocalFilters) {
  if (local.channel !== 'all' && series.channel && series.channel !== local.channel) return false
  if (local.campaign !== 'all' && series.campaignId && series.campaignId !== local.campaign) return false
  if (local.membership !== 'all' && series.membership && series.membership !== local.membership) return false
  if (local.segment !== 'all' && series.segment && series.segment !== local.segment) return false
  if (local.product !== 'all' && series.productId && series.productId !== local.product) return false
  if (local.category !== 'all' && series.category && series.category !== local.category) return false
  return true
}

function selectSeries(payload: SalesForecastJson, filters: AppliedFilters, local: SalesForecastLocalFilters) {
  const exact = payload.series.find((series) => series.id === local.seriesId && matchesGlobal(series, filters) && seriesMatchesLocal(series, local))
  if (exact) return exact
  if (filters.outlet) return payload.series.find((series) => series.level === 'outlet' && series.outletId === filters.outlet) ?? payload.series[0]!
  if (filters.city) return payload.series.find((series) => series.level === 'city' && series.city === filters.city) ?? payload.series[0]!
  if (filters.region) return payload.series.find((series) => series.level === 'region' && series.region === filters.region) ?? payload.series[0]!
  return payload.series.find((series) => series.id === 'overall:overall') ?? payload.series[0]!
}

function rankingRow(series: SalesForecastSeries, horizon: number): SalesRankingRow {
  const revenue = forecastTotal(series, 'revenue', horizon)
  const orders = forecastTotal(series, 'orders', horizon)
  const units = forecastTotal(series, 'units', horizon)
  const growth = rowGrowth(series, 'revenue', horizon)
  const stockRisk = series.level === 'product' || series.level === 'category'
    ? growth > 0.12 ? 'Demand naik - cek stok' : growth < -0.08 ? 'Demand turun' : 'Normal'
    : growth > 0.12 ? 'Capacity watch' : 'Normal'
  return {
    id: series.id,
    label: series.label,
    level: series.level,
    secondary: series.category ?? series.region ?? series.city ?? series.channel ?? series.platform ?? series.membership ?? series.segment ?? series.level,
    forecastRevenue: revenue,
    forecastOrders: orders,
    forecastUnits: units,
    grossProfit: forecastTotal(series, 'grossProfit', horizon),
    growth,
    achievement: safeDivide(revenue, series.target.revenue),
    confidence: series.metrics.revenue.metrics.forecastAccuracy,
    stockRisk,
    selectedModel: series.metrics.revenue.selectedModel,
    wape: series.metrics.revenue.metrics.wape,
  }
}

function scoped(payload: SalesForecastJson, filters: AppliedFilters, local: SalesForecastLocalFilters, level: SalesForecastGroupBy) {
  return payload.series
    .filter((series) => series.level === level)
    .filter((series) => matchesGlobal(series, filters))
    .filter((series) => seriesMatchesLocal(series, local))
}

function makeChart(series: SalesForecastSeries, metric: SalesForecastMetric, horizon: number): SalesChartPoint[] {
  const historyMetricIndex: Record<SalesForecastMetric, number> = {
    revenue: 1,
    orders: 2,
    transactions: 3,
    units: 4,
    averageBasket: 5,
    grossProfit: 6,
    conversion: 7,
  }
  const history = series.history.slice(-45).map((row) => ({ date: row[0], historical: Number(row[historyMetricIndex[metric]] ?? 0), isForecast: false }))
  const forecast = horizonRows(series, metric, horizon).map((row) => ({ date: row[0], forecast: row[1], lower: row[2], upper: row[3], isForecast: true }))
  return [...history, ...forecast]
}

function detailRows(series: SalesForecastSeries, horizon: number): SalesDetailRow[] {
  const revenue = horizonRows(series, 'revenue', horizon)
  const orders = horizonRows(series, 'orders', horizon)
  const transactions = horizonRows(series, 'transactions', horizon)
  const units = horizonRows(series, 'units', horizon)
  const basket = horizonRows(series, 'averageBasket', horizon)
  const comparableDaily = safeDivide(series.recentComparable.revenue ?? 0, horizon)
  return revenue.map((row, index) => {
    const growth = safeDivide(row[1] - comparableDaily, comparableDaily)
    const drivers = [
      index % 7 >= 4 ? 'Weekend / late-week pattern' : 'Weekday baseline',
      growth > 0.08 ? 'Positive trend' : growth < -0.08 ? 'Softening demand' : 'Stable demand',
      series.metrics.revenue.selectedModel,
    ]
    return {
      date: row[0],
      forecastRevenue: row[1],
      forecastOrders: orders[index]?.[1] ?? 0,
      forecastTransactions: transactions[index]?.[1] ?? 0,
      forecastUnits: units[index]?.[1] ?? 0,
      forecastBasket: basket[index]?.[1] ?? 0,
      lower: row[2],
      upper: row[3],
      growth,
      confidence: series.metrics.revenue.metrics.forecastAccuracy,
      drivers,
      recommendation: growth > 0.1 ? 'Siapkan kapasitas dan stok untuk sales uplift.' : growth < -0.08 ? 'Cek promo, channel mix, dan traffic driver.' : 'Pertahankan baseline plan dan monitor aktual harian.',
    }
  })
}

function scenarioValue(baseRevenue: number, assumptions: SalesScenario) {
  const multiplier =
    (1 + assumptions.marketingBudgetLift * 0.22)
    * (1 + assumptions.trafficLift * 0.35)
    * (1 + assumptions.conversionLift * 0.18)
    * (1 + assumptions.basketLift)
    * (1 + assumptions.repeatLift * 0.25)
  return Math.max(0, baseRevenue * multiplier)
}

function buildInsights(selected: SalesForecastSeries, rankings: SalesForecastResult['rankings'], horizon: number, seasonality: SalesForecastJson['seasonality']) {
  const revenue = forecastTotal(selected, 'revenue', horizon)
  const growth = rowGrowth(selected, 'revenue', horizon)
  const peakDate = [...horizonRows(selected, 'revenue', horizon)].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
  const topChannel = rankings.activeGroup.find((row) => row.level === 'channel') ?? rankings.topRevenueOutlet[0]
  return [
    `${selected.label} diproyeksikan menghasilkan revenue Rp${Math.round(revenue).toLocaleString('id-ID')} dalam ${horizon} hari.`,
    `Growth forecast sebesar ${(growth * 100).toFixed(1).replace('.', ',')}% dibanding periode comparable terakhir.`,
    `Peak sales date diproyeksikan pada ${peakDate}.`,
    `Peak hour historis berada sekitar pukul ${seasonality.peakHour}.`,
    `${topChannel?.label ?? 'Top segment'} menjadi contributor utama pada ranking aktif.`,
    `Forecast accuracy revenue backtest ${(selected.metrics.revenue.metrics.forecastAccuracy * 100).toFixed(1).replace('.', ',')}% dengan WAPE ${(selected.metrics.revenue.metrics.wape * 100).toFixed(1).replace('.', ',')}%.`,
  ]
}

function buildRecommendations(rankings: SalesForecastResult['rankings'], selected: SalesForecastSeries, horizon: number) {
  const topProduct = rankings.topProduct[0]
  const topOutlet = rankings.topRevenueOutlet[0]
  const topCampaign = rankings.topCampaign[0]
  const out: SalesForecastResult['recommendations'] = []
  if (topProduct) out.push({
    id: 'stock-product',
    target: topProduct.label,
    evidence: `Forecast units ${Math.round(topProduct.forecastUnits).toLocaleString('id-ID')} dan growth ${(topProduct.growth * 100).toFixed(1).replace('.', ',')}%.`,
    action: topProduct.growth > 0.08 ? 'Naikkan stock buffer dan cek kesiapan outlet dengan demand tinggi.' : 'Pertahankan replenishment baseline dan monitor aktual.',
    priority: topProduct.growth > 0.08 ? 'high' : 'medium',
  })
  if (topOutlet) out.push({
    id: 'outlet-capacity',
    target: topOutlet.label,
    evidence: `Forecast revenue Rp${Math.round(topOutlet.forecastRevenue).toLocaleString('id-ID')} dengan achievement ${(topOutlet.achievement * 100).toFixed(1).replace('.', ',')}%.`,
    action: 'Review roster, peak hour staffing, dan channel fulfillment untuk outlet contributor utama.',
    priority: 'high',
  })
  if (topCampaign) out.push({
    id: 'campaign-roas',
    target: topCampaign.label,
    evidence: `Forecast revenue campaign Rp${Math.round(topCampaign.forecastRevenue).toLocaleString('id-ID')}.`,
    action: 'Alokasikan budget hanya jika ROAS historis dan forecast ROAS tetap sehat; attribution ini bukan causal incrementality.',
    priority: 'medium',
  })
  out.push({
    id: 'target-gap',
    target: selected.label,
    evidence: `Daily revenue needed Rp${Math.round(selected.target.dailyRevenueNeeded).toLocaleString('id-ID')} untuk menutup target comparable-growth.`,
    action: horizon <= 30 ? 'Pantau daily target gap dan aktifkan promo weekday bila achievement forecast di bawah 100%.' : 'Gunakan forecast sebagai planning envelope, lalu refresh saat aktual baru tersedia.',
    priority: selected.target.achievement < 1 ? 'high' : 'low',
  })
  return out
}

export function querySalesForecast(payload: SalesForecastJson, filters: AppliedFilters, local: SalesForecastLocalFilters = defaultSalesForecastLocalFilters, scenario: SalesScenario = defaultSalesScenario): SalesForecastResult {
  const selected = selectSeries(payload, filters, local)
  const horizon = local.horizon
  const metric = local.metric
  const revenue = forecastTotal(selected, 'revenue', horizon)
  const orders = forecastTotal(selected, 'orders', horizon)
  const basket = safeDivide(revenue, orders)
  const growth = rowGrowth(selected, 'revenue', horizon)
  const peak = [...horizonRows(selected, 'revenue', horizon)].sort((a, b) => b[1] - a[1])[0]
  const groupRows = scoped(payload, filters, local, local.groupBy).map((series) => rankingRow(series, horizon)).sort((a, b) => b.forecastRevenue - a.forecastRevenue)
  const rankings = {
    topRevenueOutlet: scoped(payload, filters, local, 'outlet').map((series) => rankingRow(series, horizon)).sort((a, b) => b.forecastRevenue - a.forecastRevenue),
    topGrowthOutlet: scoped(payload, filters, local, 'outlet').map((series) => rankingRow(series, horizon)).sort((a, b) => b.growth - a.growth),
    topProduct: scoped(payload, filters, local, 'product').map((series) => rankingRow(series, horizon)).sort((a, b) => b.forecastRevenue - a.forecastRevenue),
    topRegion: scoped(payload, filters, local, 'region').map((series) => rankingRow(series, horizon)).sort((a, b) => b.forecastRevenue - a.forecastRevenue),
    topCampaign: scoped(payload, filters, local, 'campaign').map((series) => rankingRow(series, horizon)).sort((a, b) => b.forecastRevenue - a.forecastRevenue),
    topCategory: scoped(payload, filters, local, 'category').map((series) => rankingRow(series, horizon)).sort((a, b) => b.forecastRevenue - a.forecastRevenue),
    activeGroup: groupRows,
  }
  const campaigns = scoped(payload, filters, local, 'campaign').map((series) => {
    const row = rankingRow(series, horizon)
    const spend = series.marketing?.spend ?? 0
    return { ...row, spend, roas: safeDivide(series.marketing?.value ?? 0, spend), forecastRoas: safeDivide(row.forecastRevenue, spend) }
  }).sort((a, b) => b.forecastRevenue - a.forecastRevenue)
  const scenarioRevenue = scenarioValue(revenue, scenario)
  const insights = buildInsights(selected, rankings, horizon, payload.seasonality)
  const recommendations = buildRecommendations(rankings, selected, horizon)
  const result = {
    meta: payload.meta,
    selectedSeries: selected,
    metricLabel: payload.dims.metricLabels[metric],
    kpis: [
      { id: 'revenue', label: 'Forecast Revenue', value: revenue, display: 'currency', detail: `${horizon} hari - ${selected.metrics.revenue.selectedModel}`, tone: 'green' },
      { id: 'orders', label: 'Forecast Order', value: orders, display: 'number', detail: 'Unique order forecast', tone: 'blue' },
      { id: 'growth', label: 'Forecast Growth', value: growth, display: 'percent', detail: 'Vs comparable period', tone: growth >= 0 ? 'cyan' : 'orange' },
      { id: 'basket', label: 'Forecast Average Basket', value: basket, display: 'currency', detail: 'Revenue / order', tone: 'purple' },
      { id: 'daily', label: 'Expected Daily Revenue', value: safeDivide(revenue, horizon), display: 'currency', detail: 'Point forecast daily avg', tone: 'green' },
      { id: 'peak', label: 'Expected Peak Sales Date', value: peak?.[0] ?? '-', display: 'date', detail: peak ? `Rp${Math.round(peak[1]).toLocaleString('id-ID')}` : 'No forecast', tone: 'orange' },
      { id: 'accuracy', label: 'Forecast Accuracy', value: selected.metrics.revenue.metrics.forecastAccuracy, display: 'percent', detail: `WAPE ${(selected.metrics.revenue.metrics.wape * 100).toFixed(1)}%`, tone: 'blue' },
      { id: 'confidence', label: 'Forecast Confidence', value: selected.confidence, display: 'percent', detail: `${selected.metrics.revenue.metrics.folds} backtest folds`, tone: 'cyan' },
    ] as SalesForecastKpi[],
    chart: makeChart(selected, metric, horizon),
    rankings,
    products: rankings.topProduct,
    outlets: rankings.topRevenueOutlet,
    channels: scoped(payload, filters, local, 'channel').map((series) => rankingRow(series, horizon)).sort((a, b) => b.forecastRevenue - a.forecastRevenue),
    campaigns,
    target: {
      forecastRevenue: revenue,
      targetRevenue: selected.target.revenue,
      achievement: safeDivide(revenue, selected.target.revenue),
      remainingRevenue: Math.max(0, selected.target.revenue - revenue),
      dailyRevenueNeeded: safeDivide(Math.max(0, selected.target.revenue - revenue), horizon),
    },
    scenario: {
      forecastRevenue: scenarioRevenue,
      upliftRevenue: scenarioRevenue - revenue,
      scenarioAchievement: safeDivide(scenarioRevenue, selected.target.revenue),
      assumptions: scenario,
    },
    seasonality: payload.seasonality,
    drivers: [
      { label: 'Seasonality', contribution: payload.seasonality.dailyPattern[0]?.share ?? 0, evidence: `${payload.seasonality.dailyPattern[0]?.label ?? '-'} memiliki share revenue tertinggi.` },
      { label: 'Trend', contribution: Math.abs(growth), evidence: `Growth forecast ${(growth * 100).toFixed(1).replace('.', ',')}%.` },
      { label: 'Campaign', contribution: safeDivide(rankings.topCampaign[0]?.forecastRevenue ?? 0, revenue), evidence: `${rankings.topCampaign[0]?.label ?? 'No campaign'} adalah campaign forecast terbesar.` },
      { label: 'Product Mix', contribution: safeDivide(rankings.topProduct[0]?.forecastRevenue ?? 0, revenue), evidence: `${rankings.topProduct[0]?.label ?? 'No product'} adalah product forecast terbesar.` },
      { label: 'Membership', contribution: safeDivide(scoped(payload, filters, local, 'membership').find((series) => series.membership === 'Member') ? forecastTotal(scoped(payload, filters, local, 'membership').find((series) => series.membership === 'Member')!, 'revenue', horizon) : 0, revenue), evidence: 'Membership contribution dihitung dari transaksi member historis.' },
    ],
    backtest: {
      mae: selected.metrics.revenue.metrics.mae,
      rmse: selected.metrics.revenue.metrics.rmse,
      mape: selected.metrics.revenue.metrics.mape,
      wape: selected.metrics.revenue.metrics.wape,
      bias: selected.metrics.revenue.metrics.bias,
      accuracy: selected.metrics.revenue.metrics.forecastAccuracy,
      model: selected.metrics.revenue.selectedModel,
      baseline: selected.metrics.revenue.baselineModel,
    },
    insights,
    recommendations,
    detailRows: detailRows(selected, horizon).filter((row) => !local.search || `${row.date} ${row.recommendation} ${row.drivers.join(' ')}`.toLowerCase().includes(local.search.toLowerCase())),
    available: payload.dims,
    methodology: [
      ...payload.meta.methodology,
      `Active metric: ${payload.dims.metricLabels[metric]}.`,
      `Active series: ${selected.label}.`,
    ],
    limitations: payload.meta.limitations,
  } satisfies SalesForecastResult
  return result
}
