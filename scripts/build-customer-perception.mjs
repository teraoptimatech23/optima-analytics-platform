import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const IN_DIR = 'data'
const OUT_FILE = path.join('public', 'assets', 'customerPerception.json')
const ATTRIBUTE_IDS = [
  'brand_recommendation',
  'taste',
  'variety',
  'price',
  'promo',
  'service',
  'ordering',
  'ambience',
  'location',
  'parking',
  'app',
  'delivery_proxy',
  'loyalty_proxy',
]
const DIMENSION_IDS = ['brand', 'product', 'price-value', 'service', 'outlet-experience', 'digital-experience', 'delivery', 'loyalty']
const ATTRIBUTE_DIMENSION = [0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 6, 7]
const ATTRIBUTE_WEIGHTS = [1, 1.15, 0.85, 1.1, 0.9, 1, 0.7, 0.9, 0.75, 0.55, 1, 0.65, 0.65]
const DIMENSION_WEIGHTS = [1, 1.15, 1.05, 1, 0.9, 0.85, 0.55, 0.55]
const SOURCE_TYPES = ['direct-survey', 'behavioural-proxy', 'mixed']
const PERSONAS = ['Brand Advocate', 'Quality-Focused', 'Value Seeker', 'Convenience-Oriented', 'Digital-First', 'Service-Sensitive', 'Mixed Perception']
const DAY_MS = 24 * 60 * 60 * 1000

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
    else if (char === ',' && !quoted) {
      out.push(current)
      current = ''
    } else current += char
  }
  out.push(current)
  return out
}

function dimension(seed = []) {
  const values = []
  const map = new Map()
  function id(value) {
    const key = value || 'Unknown'
    if (!map.has(key)) {
      map.set(key, values.length)
      values.push(key)
    }
    return map.get(key)
  }
  seed.forEach(id)
  return { id, values, map }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const safeDivide = (value, total) => (total ? value / total : 0)
const round = (value, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits
const dateEpoch = (ymd) => new Date(`${ymd}T00:00:00`).getTime()
const normalizeScore = (value) => clamp(value, 1, 5)
const scoreTo100 = (score) => round((score - 1) * 25, 2)
const scoreState = (score) => score >= 4 ? 2 : score <= 2 ? 0 : 1

function weightedAverage(items) {
  const totalWeight = items.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.weight : 0), 0)
  if (!totalWeight) return 0
  return items.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.value * item.weight : 0), 0) / totalWeight
}

function proxyFromBehaviour({ deliveryShare, avgSatisfaction, avgWait, voucherRate, isMember, visits, clv, maxClv }) {
  const deliverySatisfaction = avgSatisfaction || 3
  const waitScore = clamp(5 - Math.max(0, avgWait - 5) / 4, 1, 5)
  const deliveryProxy = deliveryShare > 0
    ? normalizeScore(0.5 * deliverySatisfaction + 0.3 * waitScore + 0.2 * (3 + Math.min(2, deliveryShare * 2)))
    : 3
  const repeatScore = clamp(1 + Math.log1p(visits) / Math.log(31) * 4, 1, 5)
  const clvScore = clamp(1 + safeDivide(clv, maxClv) * 4, 1, 5)
  const memberScore = isMember ? 4.2 : 3
  const voucherScore = clamp(3 + voucherRate * 2, 1, 5)
  const loyaltyProxy = normalizeScore(0.35 * repeatScore + 0.25 * clvScore + 0.25 * memberScore + 0.15 * voucherScore)
  return { deliveryProxy, loyaltyProxy }
}

function personaFor(dimensionScores, positiveRate, npsGroup) {
  const [brand, product, price, service, outlet, digital] = dimensionScores
  if (brand >= 4.2 && positiveRate >= 0.65 && npsGroup === 'Promoter') return 0
  if (product >= price && product >= service && product >= 4) return 1
  if (price >= product && price >= 4) return 2
  if (outlet >= 4 && service >= 4) return 3
  if (digital >= 4 && digital >= outlet) return 4
  if (service <= 3.2) return 5
  return 6
}

const months = dimension()
const outlets = []
const outletIndex = new Map()
const genders = dimension(['Female', 'Male'])
const ageBands = dimension(['18-24', '25-35', '36-45', '46+'])
const segments = dimension(['Champion', 'Loyal', 'Potential', 'New', 'At Risk', 'Hibernating'])
const occupations = dimension()
const incomeBands = dimension(['<6 jt', '6-10 jt', '10-15 jt', '>15 jt'])
const acquisitions = dimension()
const channels = dimension(['Dine In', 'Take Away', 'GrabFood', 'GoFood', 'ShopeeFood', 'Aplikasi Kopi Kenangan'])
const categories = dimension(['Coffee', 'Non Coffee', 'Snack'])
const products = []
const productIndex = new Map()
const memberStates = dimension(['Non-member', 'Member'])
const npsGroups = dimension(['Detractor', 'Passive', 'Promoter'])
const personas = dimension(PERSONAS)
const customerIndex = new Map()
const customerMeta = new Map()
const txStats = new Map()

await readCsv('outlets.csv', (row) => {
  outletIndex.set(row.OutletID, outlets.length)
  outlets.push({ id: row.OutletID, name: row.OutletName, city: row.City, region: row.RegionName, type: row.OutletType })
})

await readCsv('products.csv', (row) => {
  productIndex.set(row.ProductID, products.length)
  products.push({ id: row.ProductID, name: row.ProductName, category: row.Category })
})

let maxClv = 1
await readCsv('customers.csv', (row) => {
  const customer = customerIndex.size
  customerIndex.set(row.CustomerID, customer)
  const income = Number(row.MonthlyIncome) || 0
  const clv = Number(row.CLV) || 0
  maxClv = Math.max(maxClv, clv)
  customerMeta.set(row.CustomerID, {
    customer,
    occupation: occupations.id(row.Occupation),
    incomeBand: income < 6_000_000 ? incomeBands.id('<6 jt') : income < 10_000_000 ? incomeBands.id('6-10 jt') : income < 15_000_000 ? incomeBands.id('10-15 jt') : incomeBands.id('>15 jt'),
    acquisition: acquisitions.id(row.AcquisitionChannel),
    member: memberStates.id(row.IsMember === '1' ? 'Member' : 'Non-member'),
    favoriteCategory: categories.id(row.FavoriteCategory),
    favoriteProduct: productIndex.get(row.FavoriteProductID) ?? 0,
    visits: Number(row.Visits) || 0,
    clv,
    deliveryShare: safeDivide(Number(row.DeliveryShare) || 0, 100),
  })
})

await readCsv('transactions.csv', (row) => {
  const key = row.CustomerID
  const stats = txStats.get(key) ?? { tx: 0, net: 0, satSum: 0, waitSum: 0, voucher: 0, deliveryTx: 0, first: row.Date, last: row.Date }
  stats.tx += 1
  stats.net += Number(row.NetAmount) || 0
  stats.satSum += Number(row.SatisfactionScore) || 0
  stats.waitSum += Number(row.WaitMinutes) || 0
  stats.voucher += row.VoucherCode ? 1 : 0
  if (['GrabFood', 'GoFood', 'ShopeeFood', 'Aplikasi Kopi Kenangan'].includes(row.Channel)) stats.deliveryTx += 1
  if (row.Date < stats.first) stats.first = row.Date
  if (row.Date > stats.last) stats.last = row.Date
  txStats.set(key, stats)
})

const customerFacts = []
const seenSurveyPeriod = new Set()
const duplicateSurveyPeriods = []

await readCsv('survey_responses.csv', (row) => {
  const customerMetaRow = customerMeta.get(row.CustomerID)
  const stats = txStats.get(row.CustomerID) ?? { tx: 0, net: 0, satSum: 0, waitSum: 0, voucher: 0, deliveryTx: 0, first: row.ResponseDate, last: row.ResponseDate }
  const avgSatisfaction = safeDivide(stats.satSum, stats.tx)
  const avgWait = safeDivide(stats.waitSum, stats.tx)
  const voucherRate = safeDivide(stats.voucher, stats.tx)
  const deliveryShare = customerMetaRow?.deliveryShare ?? safeDivide(stats.deliveryTx, stats.tx)
  const proxy = proxyFromBehaviour({
    deliveryShare,
    avgSatisfaction,
    avgWait,
    voucherRate,
    isMember: (customerMetaRow?.member ?? 0) === memberStates.map.get('Member'),
    visits: customerMetaRow?.visits ?? stats.tx,
    clv: customerMetaRow?.clv ?? stats.net,
    maxClv,
  })
  const nps = Number(row.NPS) || 0
  const wouldRecommend = row.WouldRecommend === '1' ? 5 : 2
  const overallSatisfaction = Number(row.OverallSatisfaction) || 0
  const brandRecommendation = normalizeScore(0.5 * (nps / 2) + 0.3 * wouldRecommend + 0.2 * overallSatisfaction)
  const scores = [
    brandRecommendation,
    Number(row.Score_taste) || 0,
    Number(row.Score_variety) || 0,
    Number(row.Score_price) || 0,
    Number(row.Score_promo) || 0,
    Number(row.Score_service) || 0,
    Number(row.Score_ordering) || 0,
    Number(row.Score_ambience) || 0,
    Number(row.Score_location) || 0,
    Number(row.Score_parking) || 0,
    Number(row.Score_app) || 0,
    proxy.deliveryProxy,
    proxy.loyaltyProxy,
  ].map(normalizeScore)
  const storedScores = scores.map((score) => round(score, 4))
  const importance = [
    4,
    Number(row.Importance_taste) || 0,
    Number(row.Importance_variety) || 0,
    Number(row.Importance_price) || 0,
    Number(row.Importance_promo) || 0,
    Number(row.Importance_service) || 0,
    Number(row.Importance_ordering) || 0,
    Number(row.Importance_ambience) || 0,
    Number(row.Importance_location) || 0,
    Number(row.Importance_parking) || 0,
    Number(row.Importance_app) || 0,
    0,
    0,
  ].map((value) => (value ? normalizeScore(value) : 0))
  const dimensionScores = DIMENSION_IDS.map((_, dimension) => {
    const attrs = scores.map((score, index) => ({ value: ATTRIBUTE_DIMENSION[index] === dimension ? score : Number.NaN, weight: ATTRIBUTE_WEIGHTS[index] }))
    return round(weightedAverage(attrs), 4)
  })
  const overall = round(weightedAverage(dimensionScores.map((value, index) => ({ value, weight: DIMENSION_WEIGHTS[index] }))), 4)
  const positiveCount = storedScores.filter((score) => score >= 4).length
  const negativeCount = storedScores.filter((score) => score <= 2).length
  const positiveRate = safeDivide(positiveCount, storedScores.length)
  const negativeRate = safeDivide(negativeCount, storedScores.length)
  const responseMonth = row.ResponseDate.slice(0, 7)
  const surveyPeriodKey = `${row.CustomerID}|${responseMonth}`
  if (seenSurveyPeriod.has(surveyPeriodKey)) duplicateSurveyPeriods.push(surveyPeriodKey)
  seenSurveyPeriod.add(surveyPeriodKey)
  const last = stats.last ? dateEpoch(stats.last) : dateEpoch(row.ResponseDate)
  const first = stats.first ? dateEpoch(stats.first) : last
  const lifetimeDays = Math.max(1, (last - first) / DAY_MS)
  const repeatRate = stats.tx > 1 ? clamp((stats.tx - 1) / Math.max(1, lifetimeDays / 30), 0, 1) : 0
  const retention = stats.tx > 1 ? 1 : 0
  const persona = personaFor(dimensionScores, positiveRate, row.NPSGroup)
  customerFacts.push([
    customerMetaRow?.customer ?? customerIndex.size,
    months.id(responseMonth),
    outletIndex.get(row.OutletID) ?? 0,
    genders.id(row.Gender),
    ageBands.id(row.AgeBand),
    segments.id(row.Segment),
    customerMetaRow?.occupation ?? occupations.id('Unknown'),
    customerMetaRow?.incomeBand ?? incomeBands.id('Unknown'),
    customerMetaRow?.acquisition ?? acquisitions.id('Unknown'),
    customerMetaRow?.member ?? memberStates.id('Non-member'),
    channels.id(row.Channel),
    customerMetaRow?.favoriteCategory ?? categories.id('Unknown'),
    customerMetaRow?.favoriteProduct ?? 0,
    npsGroups.id(row.NPSGroup),
    personas.id(PERSONAS[persona]),
    round(overall, 4),
    ...dimensionScores,
    ...storedScores,
    ...importance.map((value) => round(value, 4)),
    round(overallSatisfaction, 4),
    nps,
    row.WouldRecommend === '1' ? 1 : 0,
    round(positiveRate, 4),
    round(negativeRate, 4),
    stats.tx,
    Math.round(stats.net),
    round(avgSatisfaction, 4),
    round(avgWait, 4),
    round(repeatRate, 4),
    retention,
    Math.round(customerMetaRow?.clv ?? stats.net),
    round(deliveryShare, 4),
    round(voucherRate, 4),
  ])
})

const payload = {
  meta: {
    generatedAt: new Date().toISOString(),
    source: 'Synthetic Customer Survey Dataset + transaction/customer behavioural proxies',
    surveyHasOpenText: false,
    scoreScale: { min: 1, max: 5, positive: '4-5', neutral: '3', negative: '1-2' },
    overallFormula: 'Weighted average of eligible dimension scores using customerPerceptionDimensionWeights.',
    gapFormula: 'importance - perception score for direct survey attributes with explicit importance fields.',
    reliabilityFormula: '30% sample size + 30% direct evidence + 20% score consistency + 20% attribute completeness.',
    proxyNote: 'Delivery and loyalty dimensions are behavioural proxies and are not presented as direct customer opinion.',
    duplicateSurveyPeriods: duplicateSurveyPeriods.length,
    rowSchemas: {
      customerFacts: [
        'customer', 'month', 'outlet', 'gender', 'ageBand', 'segment', 'occupation', 'incomeBand', 'acquisition', 'member', 'channel', 'favoriteCategory', 'favoriteProduct', 'npsGroup', 'persona',
        'overall', ...DIMENSION_IDS.map((id) => `dimension:${id}`), ...ATTRIBUTE_IDS.map((id) => `score:${id}`), ...ATTRIBUTE_IDS.map((id) => `importance:${id}`),
        'overallSatisfaction', 'nps', 'wouldRecommend', 'positiveRate', 'negativeRate', 'transactionCount', 'netSpend', 'transactionSatisfaction', 'avgWaitMinutes', 'repeatRate', 'retained', 'clv', 'deliveryShare', 'voucherRate',
      ],
    },
  },
  dims: {
    months: months.values,
    outlets,
    genders: genders.values,
    ageBands: ageBands.values,
    segments: segments.values,
    occupations: occupations.values,
    incomeBands: incomeBands.values,
    acquisitions: acquisitions.values,
    memberStates: memberStates.values,
    channels: channels.values,
    categories: categories.values,
    products,
    npsGroups: npsGroups.values,
    personas: personas.values,
    dimensions: DIMENSION_IDS,
    attributes: ATTRIBUTE_IDS,
    attributeDimensions: ATTRIBUTE_DIMENSION,
    attributeWeights: ATTRIBUTE_WEIGHTS,
    dimensionWeights: DIMENSION_WEIGHTS,
    sourceTypes: SOURCE_TYPES,
    attributeSourceTypes: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  },
  customerFacts,
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))
console.log('Customer Perception build complete')
console.log(`  respondents               ${customerFacts.length.toLocaleString('en-US')}`)
console.log(`  duplicate respondent-month ${duplicateSurveyPeriods.length.toLocaleString('en-US')}`)
console.log(`  output                    ${OUT_FILE}`)
