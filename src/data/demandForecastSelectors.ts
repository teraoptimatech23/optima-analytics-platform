import forecastJson from '@/data/demandForecast.json'
import { demandForecastThresholds } from '@/config/demandForecastThresholds'
import type { AppliedFilters } from '@/data/types'

export type DemandForecastLevel = 'overall' | 'region' | 'outlet' | 'category' | 'product' | 'channel'
export type DemandForecastGranularity = 'daily' | 'weekly' | 'monthly'
export type DemandTrendStatus = 'Increasing' | 'Stable' | 'Declining' | 'Volatile' | 'Intermittent'
export type ReliabilityStatus = 'High Reliability' | 'Moderate Reliability' | 'Low Reliability' | 'Insufficient Data'

export interface DemandForecastLocalFilters {
  level: DemandForecastLevel
  horizon: number
  granularity: DemandForecastGranularity
  category: string
  product: string
  outlet: string
  channel: string
  search: string
  tablePage: number
}

interface ForecastRow {
  id: string
  level: DemandForecastLevel
  label: string
  category?: string
  productId?: string
  productName?: string
  outletId?: string
  outletName?: string
  city?: string
  region?: string
  channel?: string
  historyDays: number
  nonZeroDays: number
  zeroDemandRate: number
  historicalDemand: number
  recentComparable: number
  forecast: Array<[string, number, number, number, number, number]>
  selectedModel: string
  baselineModel: string
  fallbackReason: string
  trendStatus: DemandTrendStatus
  reliability: ReliabilityStatus
  reliabilityScore: number
  metrics: {
    wape: number
    mae: number
    rmse: number
    bias: number
    mase: number
    baselineWape: number
    improvementOverBaseline: number
    folds: number
    residualP80: number
    residualP95: number
  }
  backtest: Array<[string, number, number, number]>
  history: Array<[string, number]>
}

interface DemandForecastCube {
  meta: {
    generatedAt: string
    historyStart: string
    historyEnd: string
    metric: string
    maxHorizonDays: number
    defaultHorizonDays: number
    backtestHorizonDays: number
    backtestFolds: number
    historyDays: number
    methodology: string[]
    reconciliation: {
      method: string
      defaultHorizonCategoryTotal: number
      defaultHorizonProductTotal: number
      defaultHorizonOverallTotal: number
    }
  }
  dims: {
    products: { id: string; name: string; category: string }[]
    outlets: { id: string; name: string; city: string; region: string }[]
    categories: string[]
    channels: string[]
    regions: string[]
    dayParts: string[]
  }
  seasonalPatterns: {
    daypartShare: { label: string; units: number; share: number }[]
    channelShare: { label: string; units: number; share: number }[]
  }
  series: ForecastRow[]
}

export interface DemandForecastKpi {
  id: string
  label: string
  value: number | string
  display: 'number' | 'percent' | 'date' | 'text'
  detail: string
  tone: 'blue' | 'purple' | 'cyan' | 'orange'
}

export interface DemandForecastPoint {
  date: string
  point: number
  lower80: number
  upper80: number
  lower95: number
  upper95: number
  actual?: number
  backtest?: number
}

export interface DemandForecastEntityRow {
  id: string
  label: string
  secondary: string
  historicalDemand: number
  forecastDemand: number
  growth: number
  dailyAverage: number
  peakDate: string
  interval: string
  model: string
  wape: number
  trendStatus: DemandTrendStatus
  reliability: ReliabilityStatus
  riskStatus: string
}

export interface DemandForecastDetailRow {
  id: string
  date: string
  period: string
  label: string
  point: number
  lower: number
  upper: number
  historicalComparable: number
  growth: number
  model: string
  wape: number
  reliability: ReliabilityStatus
  riskStatus: string
}

export interface DemandForecastInsight {
  severity: 'high' | 'medium' | 'low'
  type: string
  affectedEntity: string
  evidence: string
  suggestedAction: string
}

export interface DemandForecastResult {
  meta: DemandForecastCube['meta']
  filterLabel: string
  selectedSeries: ForecastRow
  kpis: DemandForecastKpi[]
  overview: DemandForecastPoint[]
  productRows: DemandForecastEntityRow[]
  categoryRows: DemandForecastEntityRow[]
  outletRows: DemandForecastEntityRow[]
  channelRows: DemandForecastEntityRow[]
  detailRows: DemandForecastDetailRow[]
  risks: DemandForecastInsight[]
  modelRows: Array<{ model: string; value: number; label: string }>
  daypartRows: { label: string; units: number; share: number }[]
  channelShareRows: { label: string; units: number; share: number }[]
  available: {
    categories: string[]
    products: { id: string; name: string; category: string }[]
    outlets: { id: string; name: string; city: string; region: string }[]
    channels: string[]
    regions: string[]
  }
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export const defaultDemandForecastLocalFilters: DemandForecastLocalFilters = {
  level: 'overall',
  horizon: demandForecastThresholds.defaultHorizonDays,
  granularity: 'daily',
  category: 'all',
  product: 'all',
  outlet: 'all',
  channel: 'all',
  search: '',
  tablePage: 1,
}

const cube = forecastJson as unknown as DemandForecastCube
const pageSize = 12
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
const safeDivide = (value: number, total: number) => (total ? value / total : 0)
const pct = (value: number) => `${(value * 100).toFixed(1)}%`

function horizonRows(series: ForecastRow, horizon: number) {
  return series.forecast.slice(0, Math.min(horizon, series.forecast.length))
}

function totalForecast(series: ForecastRow, horizon: number) {
  return sum(horizonRows(series, horizon).map((row) => row[1]))
}

function peakDate(series: ForecastRow, horizon: number) {
  return [...horizonRows(series, horizon)].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
}

function riskStatus(row: ForecastRow, horizon: number) {
  if (row.reliability === 'Insufficient Data' || row.metrics.wape > demandForecastThresholds.lowReliabilityWape) return 'Low Confidence'
  const forecast = totalForecast(row, horizon)
  const comparable = Math.max(1, row.recentComparable)
  const growth = (forecast - comparable) / comparable
  if (growth > 0.12) return 'High Demand'
  if (growth < -0.12) return 'Declining'
  if (row.trendStatus === 'Volatile') return 'Volatile'
  return 'Normal'
}

function entityRow(row: ForecastRow, horizon: number): DemandForecastEntityRow {
  const forecast = totalForecast(row, horizon)
  const comparable = row.recentComparable
  const rows = horizonRows(row, horizon)
  return {
    id: row.id,
    label: row.label,
    secondary: row.category ?? row.region ?? row.city ?? row.channel ?? row.level,
    historicalDemand: row.historicalDemand,
    forecastDemand: forecast,
    growth: safeDivide(forecast - comparable, comparable),
    dailyAverage: safeDivide(forecast, horizon),
    peakDate: peakDate(row, horizon),
    interval: `${Math.round(sum(rows.map((item) => item[2]))).toLocaleString('id-ID')} - ${Math.round(sum(rows.map((item) => item[3]))).toLocaleString('id-ID')}`,
    model: row.selectedModel,
    wape: row.metrics.wape,
    trendStatus: row.trendStatus,
    reliability: row.reliability,
    riskStatus: riskStatus(row, horizon),
  }
}

function aggregateSeries(rows: ForecastRow[], label: string, id: string): ForecastRow {
  const first = rows[0] ?? cube.series[0]!
  const forecast = Array.from({ length: first.forecast.length }, (_, index) => [
    first.forecast[index]?.[0] ?? '',
    sum(rows.map((row) => row.forecast[index]?.[1] ?? 0)),
    sum(rows.map((row) => row.forecast[index]?.[2] ?? 0)),
    sum(rows.map((row) => row.forecast[index]?.[3] ?? 0)),
    sum(rows.map((row) => row.forecast[index]?.[4] ?? 0)),
    sum(rows.map((row) => row.forecast[index]?.[5] ?? 0)),
  ] as [string, number, number, number, number, number])
  const historyDates = new Map<string, number>()
  const backtestDates = new Map<string, [number, number, number]>()
  rows.forEach((row) => {
    row.history.forEach(([date, value]) => historyDates.set(date, (historyDates.get(date) ?? 0) + value))
    row.backtest.forEach(([date, actual, forecastValue, residual]) => {
      const current = backtestDates.get(date) ?? [0, 0, 0]
      current[0] += actual
      current[1] += forecastValue
      current[2] += residual
      backtestDates.set(date, current)
    })
  })
  const weighted = rows.reduce((acc, row) => {
    const weight = Math.max(1, row.recentComparable)
    acc.weight += weight
    acc.wape += row.metrics.wape * weight
    acc.mae += row.metrics.mae * weight
    acc.rmse += row.metrics.rmse * weight
    acc.bias += row.metrics.bias * weight
    acc.baselineWape += row.metrics.baselineWape * weight
    return acc
  }, { weight: 0, wape: 0, mae: 0, rmse: 0, bias: 0, baselineWape: 0 })
  return {
    ...first,
    id,
    level: 'overall',
    label,
    historyDays: Math.max(...rows.map((row) => row.historyDays)),
    nonZeroDays: Math.max(...rows.map((row) => row.nonZeroDays)),
    historicalDemand: sum(rows.map((row) => row.historicalDemand)),
    recentComparable: sum(rows.map((row) => row.recentComparable)),
    forecast,
    selectedModel: 'aggregated:' + first.selectedModel,
    fallbackReason: 'Aggregated from lower-level forecast series for active geography filter.',
    reliability: rows.some((row) => row.reliability === 'Low Reliability') ? 'Low Reliability' : 'Moderate Reliability',
    metrics: {
      ...first.metrics,
      wape: safeDivide(weighted.wape, weighted.weight),
      mae: safeDivide(weighted.mae, weighted.weight),
      rmse: safeDivide(weighted.rmse, weighted.weight),
      bias: safeDivide(weighted.bias, weighted.weight),
      baselineWape: safeDivide(weighted.baselineWape, weighted.weight),
    },
    history: [...historyDates.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    backtest: [...backtestDates.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, values]) => [date, values[0], values[1], values[2]]),
  }
}

function scopedSeries(filters: AppliedFilters, local: DemandForecastLocalFilters) {
  if (local.level === 'product' && local.product !== 'all') return cube.series.find((row) => row.level === 'product' && row.productId === local.product)
  if (local.level === 'category' && local.category !== 'all') return cube.series.find((row) => row.level === 'category' && row.category === local.category)
  if (local.level === 'channel' && local.channel !== 'all') return cube.series.find((row) => row.level === 'channel' && row.channel === local.channel)
  if (local.level === 'outlet' && local.outlet !== 'all') return cube.series.find((row) => row.level === 'outlet' && row.outletId === local.outlet)
  if (filters.outlet) return cube.series.find((row) => row.level === 'outlet' && row.outletId === filters.outlet)
  if (filters.city) {
    const outlets = cube.series.filter((row) => row.level === 'outlet' && row.city === filters.city)
    if (outlets.length) return aggregateSeries(outlets, `${filters.city} Demand`, `city:${filters.city}`)
  }
  if (filters.region) return cube.series.find((row) => row.level === 'region' && row.region === filters.region)
  return cube.series.find((row) => row.id === 'overall:overall') ?? cube.series[0]
}

function granulate(points: DemandForecastPoint[], granularity: DemandForecastGranularity): DemandForecastPoint[] {
  if (granularity === 'daily') return points
  const byPeriod = new Map<string, DemandForecastPoint>()
  points.forEach((point) => {
    const date = new Date(point.date + 'T00:00:00Z')
    const key = granularity === 'weekly'
      ? `${date.getUTCFullYear()} W${Math.ceil((((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7)}`
      : point.date.slice(0, 7)
    const cell = byPeriod.get(key) ?? { date: key, point: 0, lower80: 0, upper80: 0, lower95: 0, upper95: 0, actual: 0, backtest: 0 }
    cell.point += point.point
    cell.lower80 += point.lower80
    cell.upper80 += point.upper80
    cell.lower95 += point.lower95
    cell.upper95 += point.upper95
    if (point.actual !== undefined) cell.actual = (cell.actual ?? 0) + point.actual
    if (point.backtest !== undefined) cell.backtest = (cell.backtest ?? 0) + point.backtest
    byPeriod.set(key, cell)
  })
  return [...byPeriod.values()]
}

function overview(series: ForecastRow, horizon: number, granularity: DemandForecastGranularity): DemandForecastPoint[] {
  const history = series.history.slice(-45).map(([date, value]) => ({ date, point: 0, lower80: 0, upper80: 0, lower95: 0, upper95: 0, actual: value }))
  const backtest = series.backtest.slice(-28).map(([date, actual, fc]) => ({ date, point: 0, lower80: 0, upper80: 0, lower95: 0, upper95: 0, actual, backtest: fc }))
  const future = horizonRows(series, horizon).map(([date, point, lower80, upper80, lower95, upper95]) => ({ date, point, lower80, upper80, lower95, upper95 }))
  return granulate([...history, ...backtest, ...future], granularity)
}

function detailRows(series: ForecastRow, horizon: number, local: DemandForecastLocalFilters) {
  const comparableDaily = safeDivide(series.recentComparable, horizon)
  return horizonRows(series, horizon).map(([date, point, lower80, upper80], index) => ({
    id: `${series.id}-${date}`,
    date,
    period: local.granularity === 'daily' ? date : local.granularity,
    label: series.label,
    point,
    lower: lower80,
    upper: upper80,
    historicalComparable: comparableDaily,
    growth: safeDivide(point - comparableDaily, comparableDaily),
    model: series.selectedModel,
    wape: series.metrics.wape,
    reliability: series.reliability,
    riskStatus: index < 7 && point > comparableDaily * demandForecastThresholds.loadIndexHighThreshold ? 'High Demand' : riskStatus(series, horizon),
  }))
}

function risks(series: ForecastRow, horizon: number): DemandForecastInsight[] {
  const rows = horizonRows(series, horizon)
  const total = totalForecast(series, horizon)
  const peak = [...rows].sort((a, b) => b[1] - a[1])[0]
  const width = total ? sum(rows.map((row) => row[3] - row[2])) / total : 0
  return [
    series.metrics.wape > demandForecastThresholds.lowReliabilityWape && {
      severity: 'high',
      type: 'Model accuracy rendah',
      affectedEntity: series.label,
      evidence: `WAPE ${pct(series.metrics.wape)} dari rolling-origin backtest.`,
      suggestedAction: 'Gunakan upper interval untuk planning dan validasi ulang setelah data baru masuk.',
    },
    Math.abs(series.metrics.bias) > demandForecastThresholds.highBiasThreshold && {
      severity: 'medium',
      type: 'Forecast bias',
      affectedEntity: series.label,
      evidence: `Bias ${pct(series.metrics.bias)} terhadap actual validation.`,
      suggestedAction: 'Bandingkan dengan seasonal naive dan monitor satu periode aktual berikutnya.',
    },
    width > demandForecastThresholds.highUncertaintyWidthRatio && {
      severity: 'medium',
      type: 'High uncertainty',
      affectedEntity: series.label,
      evidence: `Lebar interval 80% setara ${pct(width)} dari point forecast horizon.`,
      suggestedAction: 'Gunakan suggested planning quantity dari upper interval, bukan point forecast.',
    },
    peak && {
      severity: 'low',
      type: 'Peak demand period',
      affectedEntity: series.label,
      evidence: `${peak[0]} diproyeksikan ${Math.round(peak[1]).toLocaleString('id-ID')} units.`,
      suggestedAction: 'Prioritaskan ketersediaan produk dan kapasitas operasional pada tanggal puncak.',
    },
    cube.meta.historyDays < 730 && {
      severity: 'low',
      type: 'Limited annual seasonality',
      affectedEntity: 'All series',
      evidence: `Histori tersedia ${cube.meta.historyDays} hari, belum cukup untuk annual seasonality yang kuat.`,
      suggestedAction: 'Interpretasi seasonal tahunan harus dibatasi pada pola mingguan/day-of-week.',
    },
  ].filter(Boolean) as DemandForecastInsight[]
}

export function queryDemandForecast(filters: AppliedFilters, local: DemandForecastLocalFilters = defaultDemandForecastLocalFilters): DemandForecastResult {
  const horizon = Math.min(local.horizon, cube.meta.maxHorizonDays)
  const selected = scopedSeries(filters, local) ?? cube.series[0]!
  const productRows = cube.series
    .filter((row) => row.level === 'product' && (local.category === 'all' || row.category === local.category))
    .map((row) => entityRow(row, horizon))
    .sort((a, b) => b.forecastDemand - a.forecastDemand)
  const categoryRows = cube.series.filter((row) => row.level === 'category').map((row) => entityRow(row, horizon)).sort((a, b) => b.forecastDemand - a.forecastDemand)
  const outletRows = cube.series
    .filter((row) => row.level === 'outlet')
    .filter((row) => !filters.region || row.region === filters.region)
    .filter((row) => !filters.city || row.city === filters.city)
    .map((row) => entityRow(row, horizon))
    .sort((a, b) => b.forecastDemand - a.forecastDemand)
  const channelRows = cube.series.filter((row) => row.level === 'channel').map((row) => entityRow(row, horizon)).sort((a, b) => b.forecastDemand - a.forecastDemand)
  const rawDetails = detailRows(selected, horizon, local)
  const searched = rawDetails.filter((row) => !local.search || `${row.date} ${row.label} ${row.model} ${row.riskStatus}`.toLowerCase().includes(local.search.toLowerCase()))
  const pages = Math.max(1, Math.ceil(searched.length / pageSize))
  const page = Math.min(local.tablePage, pages)
  const paged = searched.slice((page - 1) * pageSize, page * pageSize)
  const forecastDemand = totalForecast(selected, horizon)
  const peak = peakDate(selected, horizon)
  const topProduct = productRows[0]
  const topOutlet = outletRows[0]
  const forecastAccuracyIndex = Math.max(0, 1 - selected.metrics.wape)
  const highDemandPeriods = rawDetails.filter((row) => row.riskStatus === 'High Demand').length
  const filterLabel = [
    `${cube.meta.historyStart} - ${cube.meta.historyEnd}`,
    `${horizon} hari forecast`,
    selected.label,
    filters.region ?? filters.city ?? filters.outlet ?? 'Semua Wilayah',
  ].join(' · ')

  return {
    meta: cube.meta,
    filterLabel,
    selectedSeries: selected,
    kpis: [
      { id: 'forecast', label: 'Forecasted Demand', value: forecastDemand, display: 'number', detail: `${horizon} hari · ${selected.selectedModel}`, tone: 'blue' },
      { id: 'daily', label: 'Expected Daily Demand', value: safeDivide(forecastDemand, horizon), display: 'number', detail: 'Point forecast / horizon', tone: 'cyan' },
      { id: 'peakDay', label: 'Peak Forecast Day', value: peak, display: 'date', detail: 'Tanggal demand forecast tertinggi', tone: 'purple' },
      { id: 'peakDaypart', label: 'Peak Forecast Daypart', value: cube.seasonalPatterns.daypartShare[0]?.label ?? '-', display: 'text', detail: 'Berdasarkan pola historis daypart', tone: 'orange' },
      { id: 'growth', label: 'Growth vs Comparable', value: safeDivide(forecastDemand - selected.recentComparable, selected.recentComparable), display: 'percent', detail: 'Dibanding observed period sepanjang horizon', tone: 'blue' },
      { id: 'topProduct', label: 'Highest-Demand Product', value: topProduct?.label ?? '-', display: 'text', detail: topProduct ? `${Math.round(topProduct.forecastDemand).toLocaleString('id-ID')} units` : 'Tidak tersedia', tone: 'cyan' },
      { id: 'topOutlet', label: 'Highest-Demand Outlet', value: topOutlet?.label ?? '-', display: 'text', detail: topOutlet ? `${Math.round(topOutlet.forecastDemand).toLocaleString('id-ID')} units` : 'Tidak tersedia', tone: 'purple' },
      { id: 'accuracy', label: 'Forecast Accuracy Index', value: forecastAccuracyIndex, display: 'percent', detail: `Internal index = max(0, 1-WAPE); WAPE ${pct(selected.metrics.wape)}`, tone: 'orange' },
      { id: 'bias', label: 'Forecast Bias', value: selected.metrics.bias, display: 'percent', detail: 'sum(forecast-actual) / sum(actual)', tone: 'blue' },
      { id: 'risk', label: 'High-Demand Periods', value: highDemandPeriods, display: 'number', detail: 'Capacity data tidak tersedia; memakai relative load risk', tone: 'orange' },
    ],
    overview: overview(selected, horizon, local.granularity),
    productRows,
    categoryRows,
    outletRows,
    channelRows,
    detailRows: paged,
    risks: risks(selected, horizon),
    modelRows: [
      { model: selected.baselineModel, value: selected.metrics.baselineWape, label: 'Baseline WAPE' },
      { model: selected.selectedModel, value: selected.metrics.wape, label: 'Selected WAPE' },
      { model: 'bias', value: Math.abs(selected.metrics.bias), label: 'Absolute Bias' },
      { model: 'mae', value: selected.metrics.mae, label: 'MAE' },
    ],
    daypartRows: cube.seasonalPatterns.daypartShare,
    channelShareRows: cube.seasonalPatterns.channelShare,
    available: {
      categories: cube.dims.categories,
      products: cube.dims.products,
      outlets: cube.dims.outlets,
      channels: cube.dims.channels,
      regions: cube.dims.regions,
    },
    pagination: { page, pageSize, total: searched.length, pages },
  }
}
