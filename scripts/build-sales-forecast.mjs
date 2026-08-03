import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const IN_DIR = 'data'
const OUT_FILE = path.join('public', 'assets', 'salesForecast.json')
const MS_DAY = 86400000

const CONFIG = {
  maxHorizonDays: 365,
  defaultHorizonDays: 30,
  backtestHorizonDays: 14,
  backtestFolds: 5,
  seasonalWindowDays: 56,
  movingWindowDays: 28,
  minimumHistoryDays: 84,
  minimumNonZeroDays: 24,
  holtAlpha: 0.42,
  holtBeta: 0.12,
}

const metricKeys = ['revenue', 'orders', 'transactions', 'units', 'grossProfit']
const metricLabels = {
  revenue: 'Revenue',
  orders: 'Order',
  transactions: 'Transaction',
  units: 'Unit Sold',
  averageBasket: 'Average Basket',
  grossProfit: 'Gross Profit',
  conversion: 'Conversion',
}

async function readCsv(file, onRow) {
  const lines = readline.createInterface({
    input: fs.createReadStream(path.join(IN_DIR, file), { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })
  let header = null
  for await (const line of lines) {
    if (!line) continue
    const values = splitCsv(line)
    if (!header) {
      header = values
      continue
    }
    const row = {}
    for (let i = 0; i < header.length; i += 1) row[header[i]] = values[i] ?? ''
    onRow(row)
  }
}

function splitCsv(line) {
  const out = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) {
      out.push(current)
      current = ''
    } else current += char
  }
  out.push(current)
  return out
}

const iso = (date) => date.toISOString().slice(0, 10)
const addDays = (date, days) => new Date(date.getTime() + days * MS_DAY)
const sum = (values) => values.reduce((total, value) => total + value, 0)
const mean = (values) => values.length ? sum(values) / values.length : 0
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const safeDivide = (value, total, fallback = 0) => total ? value / total : fallback
const round = (value, digits = 2) => {
  const power = 10 ** digits
  return Math.round((Number.isFinite(value) ? value : 0) * power) / power
}
const quantile = (values, q) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  return (sorted[base] ?? 0) + rest * ((sorted[base + 1] ?? sorted[base] ?? 0) - (sorted[base] ?? 0))
}

function emptyMetrics() {
  return { revenue: 0, orders: 0, transactions: 0, units: 0, grossProfit: 0, activeCustomers: new Set() }
}

const products = []
const outlets = []
const customers = []
const campaigns = []
await readCsv('products.csv', (row) => products.push(row))
await readCsv('outlets.csv', (row) => outlets.push(row))
await readCsv('customers.csv', (row) => customers.push(row))
await readCsv('campaigns.csv', (row) => campaigns.push(row))

const productMeta = new Map(products.map((row) => [row.ProductID, row]))
const outletMeta = new Map(outlets.map((row) => [row.OutletID, row]))
const customerMeta = new Map(customers.map((row) => [row.CustomerID, row]))
const campaignMeta = new Map(campaigns.map((row) => [row.CampaignID, row]))

const txMap = new Map()
const datesSet = new Set()
await readCsv('transactions.csv', (row) => {
  const customer = customerMeta.get(row.CustomerID)
  const outlet = outletMeta.get(row.OutletID)
  const gross = Number(row.GrossAmount) || 0
  const net = Number(row.NetAmount) || 0
  txMap.set(row.TransactionID, {
    id: row.TransactionID,
    customerId: row.CustomerID,
    date: row.Date,
    outletId: row.OutletID,
    outletName: outlet?.OutletName ?? row.OutletID,
    city: row.City,
    region: outlet?.RegionName ?? row.RegionID,
    channel: row.Channel,
    hour: Number(row.Hour) || 0,
    campaignId: row.CampaignID || '',
    member: row.IsMemberTransaction === '1' ? 'Member' : 'Non Member',
    segment: customer?.Segment || 'Unknown Segment',
    gender: customer?.Gender || 'Unknown Gender',
    ageBand: customer?.AgeBand || 'Unknown Age',
    gross,
    net,
    discount: Number(row.DiscountAmount) || Math.max(0, gross - net),
    itemCount: Number(row.ItemCount) || 0,
  })
  datesSet.add(row.Date)
})

const dates = []
const minDate = [...datesSet].sort()[0]
const maxDate = [...datesSet].sort().at(-1)
for (let cursor = new Date(`${minDate}T00:00:00Z`); iso(cursor) <= maxDate; cursor = addDays(cursor, 1)) dates.push(iso(cursor))
const dateIndex = new Map(dates.map((date, index) => [date, index]))

const series = new Map()
function seriesKey(level, id) {
  return `${level}:${id}`
}
function ensure(level, id, label, meta = {}) {
  const key = seriesKey(level, id)
  if (!series.has(key)) series.set(key, { id: key, level, label, meta, days: Array.from({ length: dates.length }, emptyMetrics) })
  return series.get(key)
}
function descriptorsForTx(tx) {
  return [
    ['overall', 'overall', 'Total Business', {}],
    ['outlet', tx.outletId, tx.outletName, { outletId: tx.outletId, city: tx.city, region: tx.region }],
    ['region', tx.region, tx.region, { region: tx.region }],
    ['city', tx.city, tx.city, { city: tx.city, region: tx.region }],
    ['channel', tx.channel, tx.channel, { channel: tx.channel }],
    ['membership', tx.member, tx.member, { membership: tx.member }],
    ['segment', tx.segment, tx.segment, { segment: tx.segment }],
    ...(tx.campaignId ? [['campaign', tx.campaignId, campaignMeta.get(tx.campaignId)?.CampaignName ?? tx.campaignId, { campaignId: tx.campaignId, platform: campaignMeta.get(tx.campaignId)?.Platform ?? 'Unknown', objective: campaignMeta.get(tx.campaignId)?.Objective ?? 'Unknown' }]] : []),
  ]
}
function addMetrics(descriptor, date, metrics, customerId) {
  const index = dateIndex.get(date)
  if (index === undefined) return
  const target = ensure(descriptor[0], descriptor[1], descriptor[2], descriptor[3]).days[index]
  for (const key of metricKeys) target[key] += metrics[key] ?? 0
  if (customerId) target.activeCustomers.add(customerId)
}

for (const tx of txMap.values()) {
  const metrics = {
    revenue: tx.net,
    orders: 1,
    transactions: 1,
    units: tx.itemCount,
    grossProfit: Math.max(0, tx.net - tx.discount),
  }
  descriptorsForTx(tx).forEach((descriptor) => addMetrics(descriptor, tx.date, metrics, tx.customerId))
}

await readCsv('transaction_items.csv', (row) => {
  const tx = txMap.get(row.TransactionID)
  const product = productMeta.get(row.ProductID)
  if (!tx || !product) return
  const line = Number(row.LineAmount) || 0
  const qty = Number(row.Qty) || 0
  const share = safeDivide(line, tx.gross, 0)
  const metrics = {
    revenue: tx.net * share,
    orders: 1,
    transactions: 1,
    units: qty,
    grossProfit: Math.max(0, tx.net * share - tx.discount * share),
  }
  addMetrics(['category', row.Category, row.Category, { category: row.Category }], tx.date, metrics, tx.customerId)
  addMetrics(['product', row.ProductID, row.ProductName, { productId: row.ProductID, productName: row.ProductName, category: row.Category }], tx.date, metrics, tx.customerId)
})

const marketingByCampaign = new Map()
function addSpend(campaignId, spend, value) {
  if (!campaignId) return
  const current = marketingByCampaign.get(campaignId) ?? { spend: 0, value: 0 }
  current.spend += Number(spend) || 0
  current.value += Number(value) || 0
  marketingByCampaign.set(campaignId, current)
}
await readCsv('google_ads_performance.csv', (row) => addSpend(row.CampaignID, row.Spend, row.ConversionValue))
await readCsv('meta_ads_performance.csv', (row) => addSpend(row.CampaignID, row.Spend, 0))
await readCsv('youtube_ads_performance.csv', (row) => addSpend(row.CampaignID, row.Spend, 0))

function movingAverage(train, horizon) {
  const value = mean(train.slice(-CONFIG.movingWindowDays))
  return Array.from({ length: horizon }, () => Math.max(0, value))
}
function seasonalMovingAverage(train, horizon, startDow) {
  return Array.from({ length: horizon }, (_, h) => {
    const dow = (startDow + train.length + h) % 7
    const values = train.slice(-CONFIG.seasonalWindowDays).filter((_, index, arr) => (startDow + train.length - arr.length + index) % 7 === dow)
    return Math.max(0, mean(values.length ? values : train.slice(-7)))
  })
}
function holtLinear(train, horizon) {
  let level = train[0] ?? 0
  let trend = (train[1] ?? level) - level
  for (const value of train.slice(1)) {
    const previous = level
    level = CONFIG.holtAlpha * value + (1 - CONFIG.holtAlpha) * (level + trend)
    trend = CONFIG.holtBeta * (level - previous) + (1 - CONFIG.holtBeta) * trend
  }
  return Array.from({ length: horizon }, (_, h) => Math.max(0, level + (h + 1) * trend))
}
function seasonalTrend(train, horizon, startDow) {
  const seasonal = Array.from({ length: 7 }, (_, dow) => mean(train.filter((_, index) => (startDow + index) % 7 === dow)))
  const centered = train.map((value, index) => value - (seasonal[(startDow + index) % 7] ?? 0))
  const xMean = (train.length - 1) / 2
  const yMean = mean(centered)
  const denom = sum(centered.map((_, index) => (index - xMean) ** 2)) || 1
  const slope = sum(centered.map((value, index) => (index - xMean) * (value - yMean))) / denom
  const intercept = yMean - slope * xMean
  return Array.from({ length: horizon }, (_, h) => {
    const index = train.length + h
    return Math.max(0, intercept + slope * index + (seasonal[(startDow + index) % 7] ?? 0))
  })
}
function fallbackMovingAverage(train, horizon) {
  return movingAverage(train, horizon)
}

const modelFns = {
  seasonalMovingAverage,
  holtLinear,
  seasonalTrend,
  fallbackMovingAverage,
}

function metricValues(days, key) {
  if (key === 'conversion') return days.map((day) => safeDivide(day.transactions, day.activeCustomers.size))
  if (key === 'averageBasket') return days.map((day) => safeDivide(day.revenue, day.orders))
  return days.map((day) => day[key] ?? 0)
}
function metrics(actual, forecast) {
  const residuals = actual.map((value, index) => (forecast[index] ?? 0) - value)
  const abs = residuals.map(Math.abs)
  const sq = residuals.map((value) => value * value)
  const actualSum = sum(actual)
  return {
    mae: mean(abs),
    rmse: Math.sqrt(mean(sq)),
    mape: mean(actual.map((value, index) => value ? Math.abs((forecast[index] ?? 0) - value) / value : 0).filter(Number.isFinite)),
    wape: safeDivide(sum(abs), actualSum),
    bias: safeDivide(sum(residuals), actualSum),
    residuals,
  }
}
function backtest(values, startDow) {
  const folds = []
  const minTrain = Math.max(CONFIG.minimumHistoryDays, CONFIG.backtestHorizonDays * 3)
  for (let fold = CONFIG.backtestFolds - 1; fold >= 0; fold -= 1) {
    const end = values.length - fold * CONFIG.backtestHorizonDays
    const start = end - CONFIG.backtestHorizonDays
    if (start >= minTrain) folds.push({ start, end })
  }
  const results = new Map()
  for (const [model, fn] of Object.entries(modelFns).filter(([model]) => model !== 'fallbackMovingAverage')) {
    const actualAll = []
    const forecastAll = []
    for (const fold of folds) {
      const train = values.slice(0, fold.start)
      const actual = values.slice(fold.start, fold.end)
      const forecast = fn(train, actual.length, startDow)
      actualAll.push(...actual)
      forecastAll.push(...forecast)
    }
    results.set(model, { ...metrics(actualAll, forecastAll), folds: folds.length })
  }
  return { folds, results }
}
function chooseModel(values, startDow) {
  const nonZeroDays = values.filter((value) => value > 0).length
  const { folds, results } = backtest(values, startDow)
  const baseline = results.get('seasonalMovingAverage')
  if (!baseline || folds.length < 2 || nonZeroDays < CONFIG.minimumNonZeroDays) {
    return { selectedModel: 'fallbackMovingAverage', baselineModel: 'seasonalMovingAverage', metrics: results.get('fallbackMovingAverage') ?? baseline ?? { mae: 0, rmse: 0, mape: 0, wape: 0, bias: 0, residuals: [], folds: 0 }, baseline: baseline ?? { wape: 0, mae: 0, rmse: 0, mape: 0, bias: 0 }, folds, candidates: [] }
  }
  const ranked = [...results.entries()].sort((a, b) => a[1].wape - b[1].wape || Math.abs(a[1].bias) - Math.abs(b[1].bias))
  const best = ranked[0]
  const selected = best && best[1].wape <= baseline.wape * 0.995 ? best : ['seasonalMovingAverage', baseline]
  return { selectedModel: selected[0], baselineModel: 'seasonalMovingAverage', metrics: selected[1], baseline, folds, candidates: ranked.map(([model, result]) => ({ model, wape: round(result.wape, 4), mae: round(result.mae), rmse: round(result.rmse), bias: round(result.bias, 4) })) }
}

function forecastMetric(days, key) {
  const values = metricValues(days, key)
  const startDow = new Date(`${dates[0]}T00:00:00Z`).getUTCDay()
  const selected = chooseModel(values, startDow)
  const fn = modelFns[selected.selectedModel] ?? fallbackMovingAverage
  const point = fn(values, CONFIG.maxHorizonDays, startDow)
  const absResiduals = selected.metrics.residuals.map(Math.abs)
  const p80 = quantile(absResiduals, 0.8)
  const p95 = quantile(absResiduals, 0.95)
  const lastDate = new Date(`${dates.at(-1)}T00:00:00Z`)
  const forecast = point.map((value, index) => {
    const spread80 = p80 * Math.sqrt((index + 1) / CONFIG.backtestHorizonDays)
    const spread95 = p95 * Math.sqrt((index + 1) / CONFIG.backtestHorizonDays)
    return [
      iso(addDays(lastDate, index + 1)),
      round(Math.max(0, value), 2),
      round(Math.max(0, value - spread80), 2),
      round(Math.max(0, value + spread80), 2),
      round(Math.max(0, value - spread95), 2),
      round(Math.max(0, value + spread95), 2),
    ]
  })
  const backtestRows = selected.folds.flatMap((fold) => {
    const train = values.slice(0, fold.start)
    const actual = values.slice(fold.start, fold.end)
    const forecasted = fn(train, actual.length, startDow)
    return actual.map((value, index) => [dates[fold.start + index], round(value, 2), round(forecasted[index] ?? 0, 2), round((forecasted[index] ?? 0) - value, 2)])
  })
  return {
    selectedModel: selected.selectedModel,
    baselineModel: selected.baselineModel,
    metrics: {
      mae: round(selected.metrics.mae, 2),
      rmse: round(selected.metrics.rmse, 2),
      mape: round(selected.metrics.mape, 4),
      wape: round(selected.metrics.wape, 4),
      bias: round(selected.metrics.bias, 4),
      forecastAccuracy: round(clamp(1 - selected.metrics.wape, 0, 1), 4),
      baselineWape: round(selected.baseline.wape ?? 0, 4),
      folds: selected.metrics.folds ?? 0,
      residualP80: round(p80, 2),
      residualP95: round(p95, 2),
    },
    forecast,
    backtest: backtestRows.slice(-70),
    candidates: selected.candidates,
  }
}

function historyRows(days) {
  return days.map((day, index) => [
    dates[index],
    round(day.revenue, 2),
    round(day.orders, 2),
    round(day.transactions, 2),
    round(day.units, 2),
    round(safeDivide(day.revenue, day.orders), 2),
    round(day.grossProfit, 2),
    round(safeDivide(day.transactions, day.activeCustomers.size), 4),
  ]).slice(-120)
}

function buildSeries(row) {
  const metricForecasts = Object.fromEntries([...metricKeys, 'averageBasket', 'conversion'].map((key) => [key, forecastMetric(row.days, key)]))
  const revenue30 = sum(metricForecasts.revenue.forecast.slice(0, CONFIG.defaultHorizonDays).map((item) => item[1]))
  const recentRevenue = sum(row.days.slice(-CONFIG.defaultHorizonDays).map((item) => item.revenue))
  const targetGrowth = historicalGrowth(row.days.map((item) => item.revenue), CONFIG.defaultHorizonDays)
  const targetRevenue = Math.max(0, recentRevenue * (1 + targetGrowth))
  const confidence = metricForecasts.revenue.metrics.forecastAccuracy
  return {
    id: row.id,
    level: row.level,
    label: row.label,
    ...row.meta,
    historyDays: row.days.length,
    recentComparable: {
      revenue: round(recentRevenue, 2),
      orders: round(sum(row.days.slice(-CONFIG.defaultHorizonDays).map((item) => item.orders)), 2),
      transactions: round(sum(row.days.slice(-CONFIG.defaultHorizonDays).map((item) => item.transactions)), 2),
      units: round(sum(row.days.slice(-CONFIG.defaultHorizonDays).map((item) => item.units)), 2),
      grossProfit: round(sum(row.days.slice(-CONFIG.defaultHorizonDays).map((item) => item.grossProfit)), 2),
    },
    target: {
      revenue: round(targetRevenue, 2),
      targetGrowth: round(targetGrowth, 4),
      achievement: round(safeDivide(revenue30, targetRevenue), 4),
      remainingRevenue: round(Math.max(0, targetRevenue - revenue30), 2),
      dailyRevenueNeeded: round(safeDivide(Math.max(0, targetRevenue - revenue30), CONFIG.defaultHorizonDays), 2),
    },
    confidence: round(confidence, 4),
    metrics: metricForecasts,
    history: historyRows(row.days),
    marketing: row.level === 'campaign' ? marketingByCampaign.get(row.meta.campaignId) ?? { spend: 0, value: 0 } : undefined,
  }
}

function historicalGrowth(values, window) {
  const recent = sum(values.slice(-window))
  const previous = sum(values.slice(-window * 2, -window))
  if (!previous) return 0
  return clamp((recent - previous) / previous, -0.25, 0.35)
}

const forecastSeries = [...series.values()].map(buildSeries)
const overall = forecastSeries.find((row) => row.id === 'overall:overall')

const dayOfWeek = Array.from({ length: 7 }, (_, dow) => ({ dow, revenue: 0, orders: 0 }))
const monthTotals = new Map()
for (const day of ensure('overall', 'overall', 'Total Business').days) {
  const index = ensure('overall', 'overall', 'Total Business').days.indexOf(day)
  const date = dates[index]
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
  dayOfWeek[dow].revenue += day.revenue
  dayOfWeek[dow].orders += day.orders
  const month = date.slice(0, 7)
  const current = monthTotals.get(month) ?? { revenue: 0, orders: 0 }
  current.revenue += day.revenue
  current.orders += day.orders
  monthTotals.set(month, current)
}

const payload = {
  meta: {
    source: 'scripts/build-sales-forecast.mjs',
    generatedAt: new Date().toISOString(),
    period: { start: minDate, end: maxDate },
    historyDays: dates.length,
    maxHorizonDays: CONFIG.maxHorizonDays,
    defaultHorizonDays: CONFIG.defaultHorizonDays,
    metrics: [...metricKeys, 'averageBasket', 'conversion'],
    methodology: [
      'Raw transaction CSV is used only in the offline pipeline; browser receives compact daily forecast series.',
      'Revenue, orders, transactions, units, gross profit, average basket, and conversion are forecast reproducibly from historical daily series.',
      'Seasonal Moving Average is the required baseline; Holt Linear Trend and seasonal trend are used only when validation WAPE improves.',
      'Temporal rolling-origin backtest uses only observations before each validation window.',
      'Confidence intervals use empirical out-of-sample residual quantiles, not fixed +/- percentages.',
      'Target achievement uses recent comparable revenue adjusted by observed historical growth, capped to avoid extrapolation extremes.',
      'Campaign impact is descriptive attribution from transaction campaign flags and available campaign spend; it is not causal incrementality.',
    ],
    limitations: [
      'Histori sekitar 12 bulan cukup untuk day-of-week seasonality but not reliable annual seasonality.',
      'Gross profit is proxied as net revenue minus discount because COGS is not available in the synthetic dataset.',
      'Conversion is transactions per active purchasing customer, not website/session conversion.',
      'Stock risk is demand-risk proxy because inventory stock and lead time are not available.',
    ],
  },
  dims: {
    products: products.map((row) => ({ id: row.ProductID, name: row.ProductName, category: row.Category })),
    outlets: outlets.map((row) => ({ id: row.OutletID, name: row.OutletName, city: row.City, region: row.RegionName })),
    regions: [...new Set(outlets.map((row) => row.RegionName))],
    cities: [...new Set(outlets.map((row) => row.City))],
    categories: [...new Set(products.map((row) => row.Category))],
    channels: [...new Set([...txMap.values()].map((row) => row.channel))],
    campaigns: campaigns.map((row) => ({ id: row.CampaignID, name: row.CampaignName, platform: row.Platform, objective: row.Objective })),
    memberships: ['Member', 'Non Member'],
    segments: [...new Set(customers.map((row) => row.Segment).filter(Boolean))],
    metricLabels,
  },
  seasonality: {
    dailyPattern: dayOfWeek.map((row) => ({ label: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][row.dow], revenue: round(row.revenue), orders: round(row.orders), share: round(safeDivide(row.revenue, sum(dayOfWeek.map((item) => item.revenue))), 4) })),
    monthlyPattern: [...monthTotals.entries()].map(([month, value]) => ({ month, revenue: round(value.revenue), orders: round(value.orders), share: round(safeDivide(value.revenue, sum([...monthTotals.values()].map((item) => item.revenue))), 4) })),
    peakHour: derivePeakHour(),
    peakWeek: derivePeakWeek(),
    peakMonth: [...monthTotals.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0] ?? '-',
  },
  series: forecastSeries,
  summary: {
    defaultRevenue: round(sum((overall?.metrics.revenue.forecast ?? []).slice(0, CONFIG.defaultHorizonDays).map((row) => row[1])), 2),
    defaultOrders: round(sum((overall?.metrics.orders.forecast ?? []).slice(0, CONFIG.defaultHorizonDays).map((row) => row[1])), 2),
    revenueAccuracy: overall?.metrics.revenue.metrics.forecastAccuracy ?? 0,
    revenueWape: overall?.metrics.revenue.metrics.wape ?? 0,
    selectedRevenueModel: overall?.metrics.revenue.selectedModel ?? 'unknown',
  },
}

function derivePeakHour() {
  const hourly = new Map()
  for (const tx of txMap.values()) {
    const key = tx.id
    const row = txMap.get(key)
    const current = hourly.get(row.hour) ?? 0
    hourly.set(row.hour, current + row.net)
  }
  return [...hourly.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
}

function derivePeakWeek() {
  const weeks = new Map()
  for (const tx of txMap.values()) {
    const date = new Date(`${tx.date}T00:00:00Z`)
    const key = `${date.getUTCFullYear()}-W${Math.ceil((((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / MS_DAY) + 1) / 7)}`
    weeks.set(key, (weeks.get(key) ?? 0) + tx.net)
  }
  return [...weeks.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))
console.log(`wrote ${OUT_FILE} ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`)
console.log(`  series          ${forecastSeries.length.toLocaleString('en-US')}`)
console.log(`  history days    ${dates.length.toLocaleString('en-US')}`)
console.log(`  default revenue ${Math.round(payload.summary.defaultRevenue).toLocaleString('en-US')}`)
console.log(`  revenue model   ${payload.summary.selectedRevenueModel}`)
