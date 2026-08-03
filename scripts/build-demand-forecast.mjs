/**
 * Builds deterministic demand forecasts from historical item quantities.
 *
 * Demand metric is Units Sold. The script creates calendar-complete daily
 * series, runs rolling-origin backtests, compares baseline and candidate
 * statistical models, then writes compact forecasts for the browser.
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const IN_DIR = 'data'
const OUT_FILE = path.join('src', 'data', 'demandForecast.json')
const MS_DAY = 86400000

const CONFIG = {
  defaultHorizonDays: 30,
  maxHorizonDays: 90,
  backtestHorizonDays: 14,
  backtestFolds: 4,
  movingAverageWindowDays: 28,
  exponentialSmoothingAlpha: 0.35,
  minimumHistoryDays: 84,
  minimumNonZeroDays: 28,
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
    for (let i = 0; i < header.length; i += 1) row[header[i]] = values[i]
    onRow(row)
  }
}

function splitCsv(line) {
  const out = []
  let current = ''
  let quoted = false
  for (const char of line) {
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
const dayIndex = (date) => Math.floor(Date.parse(date + 'T00:00:00Z') / MS_DAY)
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const sum = (values) => values.reduce((total, value) => total + value, 0)
const mean = (values) => values.length ? sum(values) / values.length : 0
const quantile = (values, q) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  return (sorted[base] ?? 0) + rest * ((sorted[base + 1] ?? sorted[base] ?? 0) - (sorted[base] ?? 0))
}

function metrics(actual, forecast) {
  const residuals = actual.map((value, index) => (forecast[index] ?? 0) - value)
  const abs = residuals.map(Math.abs)
  const sq = residuals.map((value) => value * value)
  const actualSum = sum(actual)
  const naiveErrors = actual.slice(1).map((value, index) => Math.abs(value - (actual[index] ?? 0)))
  return {
    mae: mean(abs),
    rmse: Math.sqrt(mean(sq)),
    wape: actualSum ? sum(abs) / actualSum : 0,
    bias: actualSum ? sum(residuals) / actualSum : 0,
    mase: mean(naiveErrors) ? mean(abs) / mean(naiveErrors) : 0,
    residuals,
  }
}

function naiveForecast(train, horizon) {
  const last = train.at(-1) ?? 0
  return Array.from({ length: horizon }, () => last)
}

function seasonalNaiveForecast(train, horizon) {
  return Array.from({ length: horizon }, (_, index) => {
    const source = train.length - 7 + (index % 7)
    return Math.max(0, train[source] ?? train.at(-1) ?? 0)
  })
}

function movingAverageForecast(train, horizon) {
  const window = train.slice(-CONFIG.movingAverageWindowDays)
  const value = mean(window)
  return Array.from({ length: horizon }, () => Math.max(0, value))
}

function exponentialSmoothingForecast(train, horizon) {
  let level = train[0] ?? 0
  for (const value of train.slice(1)) level = CONFIG.exponentialSmoothingAlpha * value + (1 - CONFIG.exponentialSmoothingAlpha) * level
  return Array.from({ length: horizon }, () => Math.max(0, level))
}

function trendSeasonalForecast(train, horizon, startOffset = 0) {
  const n = train.length
  const dowMeans = Array.from({ length: 7 }, (_, dow) => {
    const values = train.filter((_, index) => (startOffset + index) % 7 === dow)
    return mean(values)
  })
  const centered = train.map((value, index) => value - (dowMeans[(startOffset + index) % 7] ?? 0))
  const xMean = (n - 1) / 2
  const yMean = mean(centered)
  const denom = sum(centered.map((_, index) => (index - xMean) ** 2)) || 1
  const slope = sum(centered.map((value, index) => (index - xMean) * (value - yMean))) / denom
  const intercept = yMean - slope * xMean
  return Array.from({ length: horizon }, (_, h) => {
    const index = n + h
    const seasonal = dowMeans[(startOffset + index) % 7] ?? 0
    return Math.max(0, intercept + slope * index + seasonal)
  })
}

const modelFns = {
  naive: naiveForecast,
  seasonalNaive: seasonalNaiveForecast,
  movingAverage: movingAverageForecast,
  exponentialSmoothing: exponentialSmoothingForecast,
  trendSeasonal: trendSeasonalForecast,
}

function backtest(values, startDow) {
  const folds = []
  const modelResults = new Map()
  const minTrain = Math.max(CONFIG.minimumHistoryDays, CONFIG.backtestHorizonDays * 3)
  for (let fold = CONFIG.backtestFolds - 1; fold >= 0; fold -= 1) {
    const validationEnd = values.length - fold * CONFIG.backtestHorizonDays
    const validationStart = validationEnd - CONFIG.backtestHorizonDays
    if (validationStart < minTrain) continue
    folds.push({ validationStart, validationEnd })
  }
  for (const [model, fn] of Object.entries(modelFns)) {
    const actualAll = []
    const forecastAll = []
    for (const fold of folds) {
      const train = values.slice(0, fold.validationStart)
      const actual = values.slice(fold.validationStart, fold.validationEnd)
      const forecast = fn(train, actual.length, startDow)
      actualAll.push(...actual)
      forecastAll.push(...forecast)
    }
    modelResults.set(model, { ...metrics(actualAll, forecastAll), folds: folds.length })
  }
  return { folds, modelResults }
}

function chooseModel(values, startDow) {
  const nonZeroDays = values.filter((value) => value > 0).length
  const zeroRate = values.length ? 1 - nonZeroDays / values.length : 1
  const { folds, modelResults } = backtest(values, startDow)
  const baselineName = 'seasonalNaive'
  const baseline = modelResults.get(baselineName)
  if (!baseline || folds.length < 2 || values.length < CONFIG.minimumHistoryDays || nonZeroDays < CONFIG.minimumNonZeroDays) {
    return {
      selectedModel: baselineName,
      baselineModel: baselineName,
      metrics: baseline ?? { mae: 0, rmse: 0, wape: 0, bias: 0, mase: 0, residuals: [], folds: folds.length },
      baseline: baseline ?? { wape: 0, mae: 0, bias: 0 },
      candidates: [...modelResults.entries()].map(([model, result]) => ({ model, wape: result.wape, mae: result.mae, rmse: result.rmse, bias: result.bias, mase: result.mase })),
      fallbackReason: values.length < CONFIG.minimumHistoryDays ? 'Insufficient history; using seasonal baseline.' : 'Sparse/intermittent demand; using seasonal baseline.',
      folds,
      zeroRate,
    }
  }

  const candidates = [...modelResults.entries()].sort((a, b) => {
    const wape = a[1].wape - b[1].wape
    if (Math.abs(wape) > 0.002) return wape
    const mae = a[1].mae - b[1].mae
    if (Math.abs(mae) > 0.01) return mae
    return Math.abs(a[1].bias) - Math.abs(b[1].bias)
  })
  const best = candidates[0]
  const selected = best && best[1].wape <= baseline.wape * 0.995 ? best : [baselineName, baseline]
  return {
    selectedModel: selected[0],
    baselineModel: baselineName,
    metrics: selected[1],
    baseline,
    candidates: [...modelResults.entries()].map(([model, result]) => ({ model, wape: result.wape, mae: result.mae, rmse: result.rmse, bias: result.bias, mase: result.mase })),
    fallbackReason: selected[0] === baselineName && best?.[0] !== baselineName ? 'Candidate model did not beat seasonal naive baseline on rolling-origin WAPE.' : '',
    folds,
    zeroRate,
  }
}

function makeSeriesForecast({ id, level, label, meta, dates, values }) {
  const historyDays = values.length
  const nonZeroDays = values.filter((value) => value > 0).length
  const startDow = new Date(dates[0] + 'T00:00:00Z').getUTCDay()
  const selection = chooseModel(values, startDow)
  const fn = modelFns[selection.selectedModel] ?? seasonalNaiveForecast
  const point = fn(values, CONFIG.maxHorizonDays, startDow)
  const absResiduals = selection.metrics.residuals.map(Math.abs)
  const q80 = quantile(absResiduals, 0.8)
  const q95 = quantile(absResiduals, 0.95)
  const lastDate = new Date(dates.at(-1) + 'T00:00:00Z')
  const forecast = point.map((value, index) => {
    const spread80 = q80 * Math.sqrt((index + 1) / CONFIG.backtestHorizonDays)
    const spread95 = q95 * Math.sqrt((index + 1) / CONFIG.backtestHorizonDays)
    return [
      iso(addDays(lastDate, index + 1)),
      Math.round(value * 10) / 10,
      Math.max(0, Math.round((value - spread80) * 10) / 10),
      Math.round((value + spread80) * 10) / 10,
      Math.max(0, Math.round((value - spread95) * 10) / 10),
      Math.round((value + spread95) * 10) / 10,
    ]
  })
  const recentComparable = sum(values.slice(-CONFIG.defaultHorizonDays))
  const forecastDefault = sum(forecast.slice(0, CONFIG.defaultHorizonDays).map((row) => row[1]))
  const growth = recentComparable ? (forecastDefault - recentComparable) / recentComparable : 0
  const volatility = mean(absResiduals) / Math.max(1, mean(values))
  const trendStatus = nonZeroDays < CONFIG.minimumNonZeroDays ? 'Intermittent' : growth > 0.08 ? 'Increasing' : growth < -0.08 ? 'Declining' : volatility > 0.25 ? 'Volatile' : 'Stable'
  const intervalWidth = forecastDefault ? sum(forecast.slice(0, CONFIG.defaultHorizonDays).map((row) => row[3] - row[2])) / forecastDefault : 0
  const improvement = selection.baseline.wape ? (selection.baseline.wape - selection.metrics.wape) / selection.baseline.wape : 0
  const reliabilityScore = clamp(
    0.25 * clamp(historyDays / 365, 0, 1)
    + 0.3 * clamp(1 - selection.metrics.wape / 0.45, 0, 1)
    + 0.2 * clamp(1 - Math.abs(selection.metrics.bias) / 0.2, 0, 1)
    + 0.15 * clamp(1 - intervalWidth / 0.9, 0, 1)
    + 0.1 * clamp((improvement + 0.05) / 0.25, 0, 1),
    0,
    1,
  )
  const reliability = historyDays < CONFIG.minimumHistoryDays || nonZeroDays < CONFIG.minimumNonZeroDays
    ? 'Insufficient Data'
    : reliabilityScore >= 0.72
      ? 'High Reliability'
      : reliabilityScore >= 0.48
        ? 'Moderate Reliability'
        : 'Low Reliability'

  return {
    id,
    level,
    label,
    ...meta,
    historyDays,
    nonZeroDays,
    zeroDemandRate: 1 - nonZeroDays / historyDays,
    historicalDemand: sum(values),
    recentComparable,
    forecast,
    selectedModel: selection.selectedModel,
    baselineModel: selection.baselineModel,
    fallbackReason: selection.fallbackReason,
    trendStatus,
    reliability,
    reliabilityScore: Math.round(reliabilityScore * 100),
    metrics: {
      wape: selection.metrics.wape,
      mae: selection.metrics.mae,
      rmse: selection.metrics.rmse,
      bias: selection.metrics.bias,
      mase: selection.metrics.mase,
      baselineWape: selection.baseline.wape,
      improvementOverBaseline: improvement,
      folds: selection.metrics.folds,
      residualP80: q80,
      residualP95: q95,
    },
    backtest: selection.folds.flatMap((fold) => {
      const train = values.slice(0, fold.validationStart)
      const actual = values.slice(fold.validationStart, fold.validationEnd)
      const fc = (modelFns[selection.selectedModel] ?? seasonalNaiveForecast)(train, actual.length, startDow)
      return actual.map((value, index) => [
        dates[fold.validationStart + index],
        value,
        Math.round((fc[index] ?? 0) * 10) / 10,
        Math.round(((fc[index] ?? 0) - value) * 10) / 10,
      ])
    }),
    history: dates.map((date, index) => [date, values[index] ?? 0]).slice(-120),
  }
}

function keyOf(level, parts) {
  return `${level}:${parts.join('|')}`
}

const outlets = []
await readCsv('outlets.csv', (row) => outlets.push(row))
const outletMeta = new Map(outlets.map((row) => [row.OutletID, row]))

const products = []
await readCsv('products.csv', (row) => products.push(row))
const productMeta = new Map(products.map((row) => [row.ProductID, row]))

const transactions = new Map()
const operatingDates = new Set()
const dateChannelUnits = new Map()
const dateDaypartUnits = new Map()
await readCsv('transactions.csv', (row) => {
  transactions.set(row.TransactionID, {
    date: row.Date,
    outlet: row.OutletID,
    channel: row.Channel,
    hour: +row.Hour,
    dayPart: row.DayPart,
    voucher: row.VoucherCode ? 1 : 0,
    campaign: row.CampaignID ? 1 : 0,
  })
  operatingDates.add(row.Date)
})

const minDate = [...operatingDates].sort()[0]
const maxDate = [...operatingDates].sort().at(-1)
const dates = []
for (let cursor = new Date(minDate + 'T00:00:00Z'); iso(cursor) <= maxDate; cursor = addDays(cursor, 1)) dates.push(iso(cursor))
const dateOffset = new Map(dates.map((date, index) => [date, index]))

const series = new Map()
function ensureSeries(level, id, label, meta) {
  const key = `${level}:${id}`
  if (!series.has(key)) series.set(key, { id: key, level, label, meta, values: new Array(dates.length).fill(0) })
  return series.get(key)
}
function addDemand(date, qty, descriptors) {
  const index = dateOffset.get(date)
  if (index === undefined || qty <= 0) return
  for (const descriptor of descriptors) ensureSeries(descriptor.level, descriptor.id, descriptor.label, descriptor.meta).values[index] += qty
}

await readCsv('transaction_items.csv', (row) => {
  const tx = transactions.get(row.TransactionID)
  const product = productMeta.get(row.ProductID)
  const outlet = outletMeta.get(tx?.outlet)
  const qty = +row.Qty
  if (!tx || !product || !outlet || qty <= 0) return
  const channelKey = `${tx.date}|${tx.channel}`
  dateChannelUnits.set(channelKey, (dateChannelUnits.get(channelKey) ?? 0) + qty)
  const daypartKey = `${tx.date}|${tx.dayPart}`
  dateDaypartUnits.set(daypartKey, (dateDaypartUnits.get(daypartKey) ?? 0) + qty)
  addDemand(tx.date, qty, [
    { level: 'overall', id: 'overall', label: 'Overall Demand', meta: {} },
    { level: 'category', id: row.Category, label: row.Category, meta: { category: row.Category } },
    { level: 'product', id: row.ProductID, label: row.ProductName, meta: { productId: row.ProductID, productName: row.ProductName, category: row.Category } },
    { level: 'outlet', id: tx.outlet, label: outlet.OutletName, meta: { outletId: tx.outlet, outletName: outlet.OutletName, city: outlet.City, region: outlet.RegionName } },
    { level: 'region', id: outlet.RegionName, label: outlet.RegionName, meta: { region: outlet.RegionName } },
    { level: 'channel', id: tx.channel, label: tx.channel, meta: { channel: tx.channel } },
  ])
})

const forecastSeries = [...series.values()].map((row) => makeSeriesForecast({ ...row, dates }))
const productForecasts = forecastSeries.filter((row) => row.level === 'product')
function sumForecastRows(rows) {
  return Array.from({ length: CONFIG.maxHorizonDays }, (_, index) => {
    const date = rows[0]?.forecast[index]?.[0]
    return [
      date,
      Math.round(sum(rows.map((row) => row.forecast[index]?.[1] ?? 0)) * 10) / 10,
      Math.round(sum(rows.map((row) => row.forecast[index]?.[2] ?? 0)) * 10) / 10,
      Math.round(sum(rows.map((row) => row.forecast[index]?.[3] ?? 0)) * 10) / 10,
      Math.round(sum(rows.map((row) => row.forecast[index]?.[4] ?? 0)) * 10) / 10,
      Math.round(sum(rows.map((row) => row.forecast[index]?.[5] ?? 0)) * 10) / 10,
    ]
  })
}
for (const category of [...new Set(products.map((row) => row.Category))]) {
  const categorySeries = forecastSeries.find((row) => row.level === 'category' && row.category === category)
  const children = productForecasts.filter((row) => row.category === category)
  if (categorySeries && children.length) {
    categorySeries.forecast = sumForecastRows(children)
    categorySeries.selectedModel = `bottomUp:${categorySeries.selectedModel}`
  }
}
const overall = forecastSeries.find((row) => row.id === 'overall:overall')
if (overall) {
  overall.forecast = sumForecastRows(productForecasts)
  overall.selectedModel = `bottomUp:${overall.selectedModel}`
}
const categoryTotal = forecastSeries.filter((row) => row.level === 'category').reduce((total, row) => total + sum(row.forecast.slice(0, CONFIG.defaultHorizonDays).map((d) => d[1])), 0)
const productTotal = forecastSeries.filter((row) => row.level === 'product').reduce((total, row) => total + sum(row.forecast.slice(0, CONFIG.defaultHorizonDays).map((d) => d[1])), 0)

const daypartTotals = new Map()
for (const [key, units] of dateDaypartUnits) {
  const daypart = key.split('|')[1]
  daypartTotals.set(daypart, (daypartTotals.get(daypart) ?? 0) + units)
}
const channelTotals = new Map()
for (const [key, units] of dateChannelUnits) {
  const channel = key.split('|')[1]
  channelTotals.set(channel, (channelTotals.get(channel) ?? 0) + units)
}

const payload = {
  meta: {
    source: 'scripts/build-demand-forecast.mjs',
    generatedAt: maxDate,
    historyStart: minDate,
    historyEnd: maxDate,
    metric: 'Units Sold',
    maxHorizonDays: CONFIG.maxHorizonDays,
    defaultHorizonDays: CONFIG.defaultHorizonDays,
    backtestHorizonDays: CONFIG.backtestHorizonDays,
    backtestFolds: CONFIG.backtestFolds,
    historyDays: dates.length,
    methodology: [
      'Calendar-complete daily series from transaction_items Qty joined to transactions date/outlet/channel.',
      'Known operating dates without demand for a slice are treated as zero demand; no closure calendar is available.',
      'Rolling-origin temporal backtesting uses only observations before each validation window.',
      'Seasonal naive is the required baseline; candidates must beat baseline WAPE or fallback to baseline.',
      'Prediction intervals are empirical residual intervals from out-of-sample backtest residuals.',
      'History is about 12 months, so weekly/day-of-week seasonality is supported but annual seasonality is not learned robustly.',
    ],
    reconciliation: {
      method: 'bottom-up by additive observed demand slices',
      defaultHorizonCategoryTotal: Math.round(categoryTotal),
      defaultHorizonProductTotal: Math.round(productTotal),
      defaultHorizonOverallTotal: Math.round(sum(overall.forecast.slice(0, CONFIG.defaultHorizonDays).map((d) => d[1]))),
    },
  },
  dims: {
    products: products.map((row) => ({ id: row.ProductID, name: row.ProductName, category: row.Category })),
    outlets: outlets.map((row) => ({ id: row.OutletID, name: row.OutletName, city: row.City, region: row.RegionName })),
    categories: [...new Set(products.map((row) => row.Category))],
    channels: [...channelTotals.keys()].sort(),
    regions: [...new Set(outlets.map((row) => row.RegionName))],
    dayParts: [...daypartTotals.keys()].sort(),
  },
  seasonalPatterns: {
    daypartShare: [...daypartTotals.entries()].map(([label, units]) => ({ label, units, share: units / sum([...daypartTotals.values()]) })).sort((a, b) => b.units - a.units),
    channelShare: [...channelTotals.entries()].map(([label, units]) => ({ label, units, share: units / sum([...channelTotals.values()]) })).sort((a, b) => b.units - a.units),
  },
  series: forecastSeries,
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))
console.log(`wrote ${OUT_FILE}  ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`)
console.log(`  series                 ${forecastSeries.length.toLocaleString('en-US')}`)
console.log(`  history days           ${dates.length.toLocaleString('en-US')}`)
console.log(`  default horizon units  ${payload.meta.reconciliation.defaultHorizonOverallTotal.toLocaleString('en-US')}`)
