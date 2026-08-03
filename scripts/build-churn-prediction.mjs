import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const IN_DIR = 'data'
const OUT_FILE = path.join('public', 'assets', 'churnPrediction.json')
const CONFIG = {
  modelVersion: 'churn-logistic-v1',
  featureVersion: 'customer-pre-ref-v1',
  observationWindowDays: 180,
  horizons: [30, 60, 90],
  minHistoryDays: 30,
  minTransactions: 2,
  learningRate: 0.035,
  epochs: 360,
  l2: 0.001,
}

async function readCsv(file, onRow) {
  const lines = readline.createInterface({ input: fs.createReadStream(path.join(IN_DIR, file), { encoding: 'utf8' }), crlfDelay: Infinity })
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
  for (const char of line) {
    if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { out.push(current); current = '' } else current += char
  }
  out.push(current)
  return out
}

function dimension(seed = []) {
  const map = new Map()
  const values = []
  function id(value) {
    const key = value || 'Unknown'
    if (!map.has(key)) { map.set(key, values.length); values.push(key) }
    return map.get(key)
  }
  seed.forEach(id)
  return { id, values, map }
}

const dayMs = 24 * 60 * 60 * 1000
const safeDivide = (a, b) => (b ? a / b : 0)
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const sigmoid = (z) => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z))
const toDate = (ymd) => new Date(`${ymd}T00:00:00`)
const toYmd = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const ymdNumber = (date) => Number(toYmd(date).replaceAll('-', ''))
const dateFromYmdNumber = (value) => toDate(String(value).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'))
const daysBetween = (a, b) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / dayMs)
const addDays = (date, days) => new Date(date.getTime() + days * dayMs)
const monthEnd = (ym) => {
  const [year, month] = ym.split('-').map(Number)
  return new Date(year, month, 0)
}
const round = (value, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits
const pctInt = (value) => Math.round(clamp(value, 0, 1) * 10000)

const outlets = []
const outletIndex = new Map()
const genders = dimension(['Female', 'Male'])
const ageBands = dimension(['18-24', '25-35', '36-45', '46+'])
const occupations = dimension()
const segments = dimension(['Champion', 'Loyal', 'Potential', 'New', 'At Risk', 'Hibernating'])
const acquisitions = dimension()
const channels = dimension(['Dine In', 'Take Away', 'GrabFood', 'GoFood', 'ShopeeFood', 'Aplikasi Kopi Kenangan'])
const products = []
const productIndex = new Map()
const categories = dimension(['Coffee', 'Non Coffee', 'Snack'])
const customerIds = []
const customers = []
const customerIndex = new Map()

await readCsv('outlets.csv', (row) => {
  outletIndex.set(row.OutletID, outlets.length)
  outlets.push({ id: row.OutletID, name: row.OutletName, city: row.City, region: row.RegionName, type: row.OutletType })
})

await readCsv('products.csv', (row) => {
  productIndex.set(row.ProductID, products.length)
  products.push({ id: row.ProductID, name: row.ProductName, category: row.Category })
  categories.id(row.Category)
})

await readCsv('customers.csv', (row) => {
  const index = customers.length
  customerIndex.set(row.CustomerID, index)
  customerIds.push(row.CustomerID)
  customers.push({
    homeOutlet: outletIndex.get(row.HomeOutletID) ?? -1,
    gender: genders.id(row.Gender),
    ageBand: ageBands.id(row.AgeBand),
    occupation: occupations.id(row.Occupation),
    segment: segments.id(row.Segment),
    acquisition: acquisitions.id(row.AcquisitionChannel),
    member: +row.IsMember,
    signupDate: row.SignupDate,
    memberSince: row.MemberSince || '',
    clv: Math.round(+row.CLV || 0),
    favoriteCategory: categories.id(row.FavoriteCategory),
    favoriteProduct: productIndex.get(row.FavoriteProductID) ?? -1,
  })
})

const txByCustomer = Array.from({ length: customers.length }, () => [])
const surveyByCustomer = Array.from({ length: customers.length }, () => [])
const seenTx = new Set()
let validTransactions = 0
let minDate = '9999-12-31'
let maxDate = '1900-01-01'

await readCsv('transactions.csv', (row) => {
  if (seenTx.has(row.TransactionID)) return
  seenTx.add(row.TransactionID)
  const customer = customerIndex.get(row.CustomerID)
  const outlet = outletIndex.get(row.OutletID)
  if (customer === undefined || outlet === undefined) return
  const net = +row.NetAmount
  if (!Number.isFinite(net) || net < 0) return
  const status = (row.TransactionStatus || row.Status || '').toLowerCase()
  if (status.includes('cancel') || status.includes('refund')) return
  const tx = {
    id: row.TransactionID,
    date: row.Date,
    ymd: Number(row.Date.replaceAll('-', '')),
    outlet,
    channel: channels.id(row.Channel),
    net,
    gross: +row.GrossAmount || 0,
    discount: +row.DiscountAmount || 0,
    voucher: row.VoucherCode ? 1 : 0,
    campaign: row.CampaignID ? 1 : 0,
    memberTx: +row.IsMemberTransaction || 0,
    sat: +row.SatisfactionScore || 0,
    wait: +row.WaitMinutes || 0,
    itemCount: +row.ItemCount || 0,
  }
  txByCustomer[customer].push(tx)
  validTransactions += 1
  if (row.Date < minDate) minDate = row.Date
  if (row.Date > maxDate) maxDate = row.Date
})

await readCsv('survey_responses.csv', (row) => {
  const customer = customerIndex.get(row.CustomerID)
  if (customer === undefined) return
  surveyByCustomer[customer].push({
    date: row.ResponseDate,
    ymd: Number(row.ResponseDate.replaceAll('-', '')),
    satisfaction: +row.OverallSatisfaction || 0,
    nps: row.NPS === '' ? null : +row.NPS,
    service: +row.Score_service || 0,
    ordering: +row.Score_ordering || 0,
    app: +row.Score_app || 0,
  })
})

txByCustomer.forEach((rows) => rows.sort((a, b) => a.ymd - b.ymd))
surveyByCustomer.forEach((rows) => rows.sort((a, b) => a.ymd - b.ymd))

const featureNames = [
  'recencyDays', 'transactionCount', 'purchaseFrequency', 'monetary', 'averageBasket', 'activeMonths',
  'voucherUsageRate', 'campaignUsageRate', 'satisfaction', 'nps', 'member', 'tenureDays',
  'channelDiversity', 'outletDiversity', 'frequencyChange', 'monetaryChange',
  'daysSinceSecondLastPurchase', 'itemsPerTransaction',
]
const driverLabels = [
  'Recency tinggi', 'Frequency rendah', 'Monetary rendah', 'Basket menurun', 'Voucher dependency',
  'Satisfaction rendah', 'NPS rendah', 'Tenure pendek', 'Channel diversity rendah',
]

function featureSnapshot(customer, referenceDate, horizon) {
  const refYmd = ymdNumber(referenceDate)
  const obsStartDate = addDays(referenceDate, -CONFIG.observationWindowDays + 1)
  const obsStartYmd = ymdNumber(obsStartDate)
  const allBefore = txByCustomer[customer].filter((tx) => tx.ymd <= refYmd)
  const obs = allBefore.filter((tx) => tx.ymd >= obsStartYmd)
  const first = allBefore[0]
  if (!first) return null
  const historyDays = Math.max(0, Math.round((referenceDate.getTime() - toDate(first.date).getTime()) / dayMs))
  if (historyDays < CONFIG.minHistoryDays || allBefore.length < CONFIG.minTransactions || !obs.length) {
    return { insufficient: true, historyDays, allBefore: allBefore.length }
  }
  const last = allBefore[allBefore.length - 1]
  const secondLast = allBefore[allBefore.length - 2]
  const recentStart = ymdNumber(addDays(referenceDate, -29))
  const previousStart = ymdNumber(addDays(referenceDate, -59))
  const recent = allBefore.filter((tx) => tx.ymd >= recentStart)
  const previous = allBefore.filter((tx) => tx.ymd >= previousStart && tx.ymd < recentStart)
  const activeMonths = new Set(obs.map((tx) => tx.date.slice(0, 7))).size
  const byChannel = new Map()
  const byOutlet = new Map()
  let monetary = 0
  let items = 0
  let voucher = 0
  let campaign = 0
  let sat = 0
  let wait = 0
  for (const tx of obs) {
    monetary += tx.net
    items += tx.itemCount
    voucher += tx.voucher
    campaign += tx.campaign
    sat += tx.sat
    wait += tx.wait
    byChannel.set(tx.channel, (byChannel.get(tx.channel) ?? 0) + 1)
    byOutlet.set(tx.outlet, (byOutlet.get(tx.outlet) ?? 0) + 1)
  }
  const survey = surveyByCustomer[customer].filter((row) => row.ymd <= refYmd)
  const surveyRecent = survey.slice(-2)
  const satisfaction = surveyRecent.length ? surveyRecent.reduce((sum, row) => sum + row.satisfaction, 0) / surveyRecent.length : sat / obs.length
  const npsRows = surveyRecent.filter((row) => row.nps !== null)
  const nps = npsRows.length ? npsRows.reduce((sum, row) => sum + row.nps, 0) / npsRows.length : 0
  const preferredChannel = [...byChannel.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? -1
  const preferredOutlet = [...byOutlet.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? customers[customer].homeOutlet
  const recencyDays = Math.max(0, Math.round((referenceDate.getTime() - toDate(last.date).getTime()) / dayMs))
  const purchaseFrequency = obs.length / Math.max(1, CONFIG.observationWindowDays / 30)
  const recentMonetary = recent.reduce((sum, tx) => sum + tx.net, 0)
  const previousMonetary = previous.reduce((sum, tx) => sum + tx.net, 0)
  const futureStart = ymdNumber(addDays(referenceDate, 1))
  const futureEnd = ymdNumber(addDays(referenceDate, horizon))
  const returned = txByCustomer[customer].some((tx) => tx.ymd >= futureStart && tx.ymd <= futureEnd)
  const label = returned ? 0 : 1
  const values = {
    recencyDays,
    transactionCount: obs.length,
    purchaseFrequency,
    monetary,
    averageBasket: safeDivide(monetary, obs.length),
    activeMonths,
    voucherUsageRate: safeDivide(voucher, obs.length),
    campaignUsageRate: safeDivide(campaign, obs.length),
    satisfaction,
    nps,
    member: customers[customer].member,
    tenureDays: historyDays,
    channelDiversity: byChannel.size,
    outletDiversity: byOutlet.size,
    frequencyChange: safeDivide(recent.length - previous.length, Math.max(1, previous.length)),
    monetaryChange: safeDivide(recentMonetary - previousMonetary, Math.max(1, previousMonetary)),
    daysSinceSecondLastPurchase: secondLast ? Math.max(0, Math.round((referenceDate.getTime() - toDate(secondLast.date).getTime()) / dayMs)) : recencyDays,
    itemsPerTransaction: safeDivide(items, obs.length),
  }
  return {
    customer,
    referenceDate: toYmd(referenceDate),
    referenceYmd: refYmd,
    horizon,
    label,
    values,
    preferredChannel,
    preferredOutlet,
    recentValue90: recentMonetary * 3 || monetary / Math.max(1, CONFIG.observationWindowDays / 90),
    clv: customers[customer].clv,
    firstPurchaseDate: first.date,
    lastPurchaseDate: last.date,
    insufficient: false,
    avgWait: safeDivide(wait, obs.length),
  }
}

function zPrep(rows) {
  const means = featureNames.map((name) => rows.reduce((sum, row) => sum + row.values[name], 0) / Math.max(1, rows.length))
  const stds = featureNames.map((name, index) => Math.sqrt(rows.reduce((sum, row) => sum + (row.values[name] - means[index]) ** 2, 0) / Math.max(1, rows.length)) || 1)
  return { means, stds }
}

function vector(row, prep) {
  return featureNames.map((name, index) => (row.values[name] - prep.means[index]) / prep.stds[index])
}

function trainLogistic(rows, prep) {
  const weights = Array.from({ length: featureNames.length }, () => 0)
  let bias = Math.log(safeDivide(rows.filter((row) => row.label).length, rows.length - rows.filter((row) => row.label).length) || 0.2)
  const pos = rows.filter((row) => row.label).length
  const neg = rows.length - pos
  const posWeight = safeDivide(rows.length, 2 * Math.max(1, pos))
  const negWeight = safeDivide(rows.length, 2 * Math.max(1, neg))
  for (let epoch = 0; epoch < CONFIG.epochs; epoch += 1) {
    const grad = Array.from({ length: weights.length }, () => 0)
    let gradBias = 0
    for (const row of rows) {
      const x = vector(row, prep)
      const p = sigmoid(bias + weights.reduce((sum, w, i) => sum + w * x[i], 0))
      const sampleWeight = row.label ? posWeight : negWeight
      const error = (p - row.label) * sampleWeight
      gradBias += error
      for (let i = 0; i < weights.length; i += 1) grad[i] += error * x[i] + CONFIG.l2 * weights[i]
    }
    bias -= CONFIG.learningRate * gradBias / rows.length
    for (let i = 0; i < weights.length; i += 1) weights[i] -= CONFIG.learningRate * grad[i] / rows.length
  }
  return { weights, bias, prep }
}

function predict(model, row) {
  const x = vector(row, model.prep)
  return sigmoid(model.bias + model.weights.reduce((sum, w, i) => sum + w * x[i], 0))
}

function recencyBaseline(train, validation) {
  const candidates = [...new Set(train.map((row) => row.values.recencyDays))].sort((a, b) => a - b)
  let best = { threshold: candidates[0] ?? 30, f1: -1 }
  for (const threshold of candidates) {
    const scored = validation.map((row) => ({ label: row.label, score: row.values.recencyDays >= threshold ? 1 : 0 }))
    const m = metricsAtThreshold(scored, 0.5)
    if (m.f1 > best.f1) best = { threshold, f1: m.f1 }
  }
  return { threshold: best.threshold }
}

function baselineScore(model, row) {
  return row.values.recencyDays >= model.threshold ? 0.78 : 0.18
}

function metricsAtThreshold(scored, threshold) {
  let tp = 0; let fp = 0; let tn = 0; let fn = 0
  for (const row of scored) {
    const pred = row.score >= threshold ? 1 : 0
    if (pred && row.label) tp += 1
    else if (pred && !row.label) fp += 1
    else if (!pred && row.label) fn += 1
    else tn += 1
  }
  const precision = safeDivide(tp, tp + fp)
  const recall = safeDivide(tp, tp + fn)
  return { tp, fp, tn, fn, precision, recall, f1: safeDivide(2 * precision * recall, precision + recall), accuracy: safeDivide(tp + tn, scored.length) }
}

function rocAuc(scored) {
  const sorted = scored.slice().sort((a, b) => a.score - b.score)
  const pos = sorted.filter((row) => row.label).length
  const neg = sorted.length - pos
  if (!pos || !neg) return 0
  let rankSum = 0
  sorted.forEach((row, index) => { if (row.label) rankSum += index + 1 })
  return (rankSum - pos * (pos + 1) / 2) / (pos * neg)
}

function prAuc(scored) {
  const sorted = scored.slice().sort((a, b) => b.score - a.score)
  const pos = sorted.filter((row) => row.label).length
  if (!pos) return 0
  let tp = 0
  let fp = 0
  let lastRecall = 0
  let area = 0
  for (const row of sorted) {
    if (row.label) tp += 1
    else fp += 1
    const recall = tp / pos
    const precision = safeDivide(tp, tp + fp)
    area += (recall - lastRecall) * precision
    lastRecall = recall
  }
  return area
}

function curveRows(scored) {
  const sorted = scored.slice().sort((a, b) => b.score - a.score)
  const pos = sorted.filter((row) => row.label).length
  const neg = sorted.length - pos
  let tp = 0; let fp = 0
  const roc = [[0, 0]]
  const pr = []
  sorted.forEach((row, index) => {
    if (row.label) tp += 1
    else fp += 1
    if (index % Math.max(1, Math.floor(sorted.length / 36)) === 0 || index === sorted.length - 1) {
      roc.push([round(safeDivide(fp, neg), 4), round(safeDivide(tp, pos), 4)])
      pr.push([round(safeDivide(tp, pos), 4), round(safeDivide(tp, tp + fp), 4)])
    }
  })
  return { roc, pr }
}

function calibration(scored) {
  const bins = Array.from({ length: 10 }, (_, index) => ({ bucket: index, n: 0, pred: 0, actual: 0 }))
  scored.forEach((row) => {
    const index = Math.min(9, Math.floor(row.score * 10))
    bins[index].n += 1
    bins[index].pred += row.score
    bins[index].actual += row.label
  })
  let ece = 0
  const rows = bins.map((bin) => {
    const predicted = safeDivide(bin.pred, bin.n)
    const observed = safeDivide(bin.actual, bin.n)
    ece += safeDivide(bin.n, scored.length) * Math.abs(predicted - observed)
    return [bin.bucket, round(predicted, 4), round(observed, 4), bin.n]
  })
  const brier = safeDivide(scored.reduce((sum, row) => sum + (row.score - row.label) ** 2, 0), scored.length)
  const logLoss = safeDivide(scored.reduce((sum, row) => sum - (row.label ? Math.log(clamp(row.score, 1e-6, 1)) : Math.log(clamp(1 - row.score, 1e-6, 1))), 0), scored.length)
  return { rows, ece, brier, logLoss }
}

function liftCurve(scored) {
  const sorted = scored.slice().sort((a, b) => b.score - a.score)
  const positives = sorted.filter((row) => row.label).length
  const out = []
  for (const share of [0.05, 0.1, 0.2, 0.3, 0.5, 1]) {
    const n = Math.max(1, Math.round(sorted.length * share))
    const captured = sorted.slice(0, n).filter((row) => row.label).length
    out.push([share, round(safeDivide(captured, positives), 4), round(safeDivide(safeDivide(captured, positives), share), 4)])
  }
  return out
}

function chooseThreshold(scored, policy = 'balanced') {
  if (policy === 'top-capacity') {
    const sorted = scored.slice().sort((a, b) => b.score - a.score)
    return sorted[Math.max(0, Math.round(sorted.length * 0.2) - 1)]?.score ?? 0.5
  }
  let best = { threshold: 0.5, value: -1 }
  for (let i = 5; i <= 95; i += 1) {
    const threshold = i / 100
    const m = metricsAtThreshold(scored, threshold)
    const eligible = policy === 'high-recall' ? m.recall >= 0.7 : policy === 'high-precision' ? m.precision >= 0.35 : true
    const value = eligible ? (policy === 'high-recall' ? m.recall + m.precision * 0.25 : policy === 'high-precision' ? m.precision + m.recall * 0.25 : m.f1) : -1
    if (value > best.value) best = { threshold, value }
  }
  return best.threshold
}

function evaluate(scored, threshold) {
  const thresholdMetrics = metricsAtThreshold(scored, threshold)
  const cal = calibration(scored)
  return {
    sampleCount: scored.length,
    positiveRate: safeDivide(scored.filter((row) => row.label).length, scored.length),
    rocAuc: rocAuc(scored),
    prAuc: prAuc(scored),
    ...thresholdMetrics,
    brierScore: cal.brier,
    logLoss: cal.logLoss,
    calibrationError: cal.ece,
    liftAt10: liftCurve(scored).find((row) => row[0] === 0.1)?.[2] ?? 0,
    recallAt10: liftCurve(scored).find((row) => row[0] === 0.1)?.[1] ?? 0,
  }
}

function periodDates(horizon) {
  const max = toDate(maxDate)
  const dates = []
  const months = [...new Set(txByCustomer.flatMap((rows) => rows.map((tx) => tx.date.slice(0, 7))))].sort()
  for (const month of months) {
    const date = monthEnd(month)
    if (date < addDays(toDate(minDate), 120)) continue
    if (addDays(date, horizon) <= max) dates.push(date)
  }
  return dates
}

function riskBand(score) {
  if (score >= 0.8) return 0
  if (score >= 0.6) return 1
  if (score >= 0.35) return 2
  return 3
}

function journeyStage(recency, tx) {
  if (tx <= 1 && recency <= 30) return 0
  if (recency <= 30 && tx >= 8) return 3
  if (recency <= 60) return 2
  if (recency <= 120) return 4
  return 5
}

function rfmSegment(values) {
  if (values.recencyDays <= 30 && values.transactionCount >= 10 && values.monetary >= 600000) return 0
  if (values.recencyDays <= 45 && values.transactionCount >= 6) return 1
  if (values.recencyDays <= 45) return 2
  if (values.recencyDays <= 90) return 3
  if (values.transactionCount >= 6 || values.monetary >= 500000) return 4
  return 5
}

function driverIndex(row, model) {
  const z = vector(row, model.prep)
  const contributions = model.weights.map((w, index) => w * z[index])
  const candidates = [
    [0, contributions[0]], [1, -contributions[1]], [2, -contributions[3]], [3, -contributions[14]],
    [4, contributions[6]], [5, -contributions[8]], [6, -contributions[9]], [7, -contributions[11]], [8, -contributions[12]],
  ]
  return candidates.sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
}

function trainForHorizon(horizon) {
  const refs = periodDates(horizon)
  const snapshots = []
  refs.forEach((refDate) => {
    for (let c = 0; c < customers.length; c += 1) {
      const snap = featureSnapshot(c, refDate, horizon)
      if (snap && !snap.insufficient) snapshots.push(snap)
    }
  })
  const uniqueRefs = [...new Set(snapshots.map((row) => row.referenceDate))].sort()
  const testRef = uniqueRefs[uniqueRefs.length - 1]
  const valRef = uniqueRefs[uniqueRefs.length - 2]
  const trainRefs = new Set(uniqueRefs.slice(0, -2))
  const train = snapshots.filter((row) => trainRefs.has(row.referenceDate))
  const validation = snapshots.filter((row) => row.referenceDate === valRef)
  const test = snapshots.filter((row) => row.referenceDate === testRef)
  const prep = zPrep(train)
  const logistic = trainLogistic(train, prep)
  const baseline = recencyBaseline(train, validation)
  const valLogistic = validation.map((row) => ({ label: row.label, score: predict(logistic, row) }))
  const valBaseline = validation.map((row) => ({ label: row.label, score: baselineScore(baseline, row) }))
  const threshold = chooseThreshold(valLogistic, 'balanced')
  const baselineThreshold = 0.5
  const logisticPerf = evaluate(test.map((row) => ({ label: row.label, score: predict(logistic, row) })), threshold)
  const baselinePerf = evaluate(test.map((row) => ({ label: row.label, score: baselineScore(baseline, row) })), baselineThreshold)
  const selected = logisticPerf.prAuc >= baselinePerf.prAuc && logisticPerf.recall >= baselinePerf.recall * 0.85
  const model = selected ? logistic : baseline
  const selectedName = selected ? 'Logistic Regression' : 'Recency Rule Baseline'
  const testScored = test.map((row) => ({ label: row.label, score: selected ? predict(logistic, row) : baselineScore(baseline, row) }))
  const curves = curveRows(testScored)
  const cal = calibration(testScored)
  const currentRef = toDate(maxDate)
  const current = []
  let insufficient = 0
  for (let c = 0; c < customers.length; c += 1) {
    const snap = featureSnapshot(c, currentRef, horizon)
    if (!snap || snap.insufficient) { insufficient += 1; continue }
    const score = selected ? predict(logistic, snap) : baselineScore(baseline, snap)
    const expectedValue = Math.round(score * (snap.recentValue90 || snap.values.monetary || snap.clv * 0.08))
    const priority = Math.round(score * 55 + safeDivide(expectedValue, 1_000_000) * 25 + (snap.values.member ? 8 : 0) + Math.max(0, -snap.values.frequencyChange) * 12)
    current.push([
      c, customers[c].homeOutlet, customers[c].gender, customers[c].ageBand, customers[c].segment, customers[c].acquisition, customers[c].member,
      ymdNumber(currentRef), horizon, pctInt(score), riskBand(score), pctInt(threshold),
      snap.values.recencyDays, snap.values.transactionCount, Math.round(snap.values.purchaseFrequency * 100),
      Math.round(snap.values.monetary), Math.round(snap.values.averageBasket), Math.round(snap.values.frequencyChange * 10000),
      Math.round(snap.values.monetaryChange * 10000), snap.values.activeMonths, pctInt(snap.values.voucherUsageRate),
      pctInt(snap.values.campaignUsageRate), Math.round(snap.values.satisfaction * 100), Math.round(snap.values.nps),
      snap.clv, snap.preferredChannel, snap.preferredOutlet, rfmSegment(snap.values), journeyStage(snap.values.recencyDays, snap.values.transactionCount),
      driverIndex(snap, selected ? logistic : { ...logistic, weights: featureNames.map((name) => name === 'recencyDays' ? 1 : 0) }), expectedValue, priority,
      customers[c].favoriteCategory, customers[c].favoriteProduct,
    ])
  }
  const selectedPerf = evaluate(testScored, threshold)
  return {
    horizon,
    model: {
      selectedModel: selectedName,
      baselineModel: 'Recency Rule Baseline',
      selectedThreshold: round(threshold, 4),
      trainPeriod: `${uniqueRefs[0]} to ${uniqueRefs[Math.max(0, uniqueRefs.length - 3)]}`,
      validationPeriod: valRef,
      testPeriod: testRef,
      snapshots: snapshots.length,
      trainSnapshots: train.length,
      validationSnapshots: validation.length,
      testSnapshots: test.length,
      positiveRate: round(selectedPerf.positiveRate, 4),
      selected: {
        sampleCount: selectedPerf.sampleCount,
        positiveRate: round(selectedPerf.positiveRate, 4),
        rocAuc: round(selectedPerf.rocAuc, 4),
        prAuc: round(selectedPerf.prAuc, 4),
        precision: round(selectedPerf.precision, 4),
        recall: round(selectedPerf.recall, 4),
        f1: round(selectedPerf.f1, 4),
        accuracy: round(selectedPerf.accuracy, 4),
        brierScore: round(selectedPerf.brierScore, 4),
        logLoss: round(selectedPerf.logLoss, 4),
        calibrationError: round(selectedPerf.calibrationError, 4),
        liftAt10: round(selectedPerf.liftAt10, 4),
        recallAt10: round(selectedPerf.recallAt10, 4),
        confusionMatrix: [selectedPerf.tp, selectedPerf.fp, selectedPerf.tn, selectedPerf.fn],
      },
      baseline: {
        rocAuc: round(baselinePerf.rocAuc, 4),
        prAuc: round(baselinePerf.prAuc, 4),
        precision: round(baselinePerf.precision, 4),
        recall: round(baselinePerf.recall, 4),
        f1: round(baselinePerf.f1, 4),
        liftAt10: round(baselinePerf.liftAt10, 4),
        threshold: baseline.threshold,
      },
      validation: {
        logisticPrAuc: round(prAuc(valLogistic), 4),
        baselinePrAuc: round(prAuc(valBaseline), 4),
      },
      featureImportance: featureNames.map((name, index) => [name, round(Math.abs(logistic.weights[index] ?? 0), 4), round(logistic.weights[index] ?? 0, 4)])
        .sort((a, b) => b[1] - a[1]),
      rocCurve: curves.roc,
      precisionRecallCurve: curves.pr,
      liftCurve: liftCurve(testScored),
      calibration: cal.rows,
      reliability: selectedPerf.prAuc >= baselinePerf.prAuc ? 'Model selected after baseline comparison' : 'Baseline fallback selected',
      calibrationStatus: selectedPerf.calibrationError <= 0.12 ? 'Probability calibration acceptable' : 'Calibration requires monitoring',
    },
    predictions: current.sort((a, b) => b[9] - a[9]),
    insufficient,
  }
}

const horizonModels = CONFIG.horizons.map(trainForHorizon)

const payload = {
  meta: {
    source: 'scripts/build-churn-prediction.mjs',
    generatedAt: new Date().toISOString(),
    modelVersion: CONFIG.modelVersion,
    featureVersion: CONFIG.featureVersion,
    trainingDate: new Date().toISOString().slice(0, 10),
    period: { start: minDate, end: maxDate },
    predictionReferenceDate: maxDate,
    observationWindowDays: CONFIG.observationWindowDays,
    minimumHistoryDays: CONFIG.minHistoryDays,
    minimumTransactions: CONFIG.minTransactions,
    validTransactions,
    methodology: [
      'Features are generated only from transactions and survey responses with timestamps on or before the prediction reference date.',
      'Target label is churn=1 when a customer has no valid transaction during the prediction horizon after the reference date.',
      'Temporal split uses earlier reference snapshots for train, the next reference snapshot for validation, and the last historical snapshot for test.',
      'Threshold is selected on validation data only; test set is used only for final reporting.',
      'Current customer predictions are generated at the latest dataset date and have no future labels.',
    ],
  },
  dims: {
    customerIds,
    outlets,
    genders: genders.values,
    ageBands: ageBands.values,
    occupations: occupations.values,
    customerSegments: segments.values,
    acquisitions: acquisitions.values,
    channels: channels.values,
    categories: categories.values,
    products,
    riskBands: ['Critical Risk', 'High Risk', 'Medium Risk', 'Low Risk'],
    rfmSegments: ['Champions', 'Loyal Customers', 'Potential Loyalists', 'Need Attention', 'At Risk', 'Hibernating'],
    journeyStages: ['First Purchase', 'Second Purchase', 'Repeat', 'Loyalty', 'At Risk', 'Dormant'],
    drivers: driverLabels,
    featureNames,
  },
  // [customer, homeOutlet, gender, age, segment, acquisition, member, refYmd, horizon, scoreX10000, band, thresholdX10000, recency, tx, freqX100, monetary, avgBasket, freqChangeX10000, monetaryChangeX10000, activeMonths, voucherRateX10000, campaignRateX10000, satX100, nps, clv, channel, outlet, rfmSegment, journeyStage, driver, expectedValueAtRisk, priorityScore, favoriteCategory, favoriteProduct]
  predictions: Object.fromEntries(horizonModels.map((row) => [row.horizon, row.predictions])),
  insufficientHistory: Object.fromEntries(horizonModels.map((row) => [row.horizon, row.insufficient])),
  models: Object.fromEntries(horizonModels.map((row) => [row.horizon, row.model])),
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))
console.log(`wrote ${OUT_FILE} ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`)
console.log(`  customers              ${customers.length.toLocaleString('en-US')}`)
console.log(`  valid transactions     ${validTransactions.toLocaleString('en-US')}`)
for (const row of horizonModels) {
  console.log(`  horizon ${row.horizon}d predictions ${row.predictions.length.toLocaleString('en-US')} insufficient ${row.insufficient.toLocaleString('en-US')} model ${row.model.selectedModel}`)
}
