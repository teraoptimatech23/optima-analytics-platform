import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const IN_DIR = 'data'
const OUT_FILE = path.join('src', 'data', 'customerMotivation.json')

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

function dimension(seed = []) {
  const map = new Map()
  const values = []
  for (const value of seed) id(value)
  function id(value) {
    const key = value || 'Unknown'
    if (!map.has(key)) {
      map.set(key, values.length)
      values.push(key)
    }
    return map.get(key)
  }
  return { id, values, map }
}

const genders = dimension(['Female', 'Male'])
const ageBands = dimension(['18-24', '25-35', '36-45', '46+'])
const segments = dimension(['Champion', 'Loyal', 'Potential', 'New', 'At Risk', 'Hibernating'])
const acquisitions = dimension()
const occupations = dimension()
const channels = dimension(['Dine In', 'Take Away', 'GrabFood', 'GoFood', 'ShopeeFood', 'Aplikasi Kopi Kenangan'])
const categories = dimension(['Coffee', 'Non Coffee', 'Snack'])
const products = []
const productIndex = new Map()
const outlets = []
const outletIndex = new Map()
const months = dimension()

for (let y = 2025, m = 7; !(y === 2026 && m === 7); m += 1) {
  if (m > 12) { m = 1; y += 1 }
  months.id(`${y}-${String(m).padStart(2, '0')}`)
}

await readCsv('products.csv', (row) => {
  productIndex.set(row.ProductID, products.length)
  products.push({ id: row.ProductID, name: row.ProductName, category: row.Category })
})
await readCsv('outlets.csv', (row) => {
  outletIndex.set(row.OutletID, outlets.length)
  outlets.push({ id: row.OutletID, name: row.OutletName, city: row.City, region: row.RegionName })
})

const customerRows = []
const customerMap = new Map()
await readCsv('customers.csv', (row) => {
  const index = customerRows.length
  const outlet = outletIndex.get(row.HomeOutletID)
  const favoriteProduct = productIndex.get(row.FavoriteProductID) ?? -1
  customerRows.push([
    outlet,
    genders.id(row.Gender),
    ageBands.id(row.AgeBand),
    segments.id(row.Segment),
    occupations.id(row.Occupation),
    acquisitions.id(row.AcquisitionChannel),
    +row.IsMember,
    +row.Visits,
    Math.round(+row.NetSpend),
    Math.round(+row.AvgBasket),
    +row.VoucherUses,
    Math.round(+row.DeliveryShare * 100),
    Math.round(+row.AvgSatisfaction * 100),
    row.NPS === '' ? -1 : +row.NPS,
    +row.RecencyDays,
    Math.round(+row.FrequencyPerMonth * 100),
    Math.round(+row.CLV),
    categories.id(row.FavoriteCategory),
    favoriteProduct,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ])
  customerMap.set(row.CustomerID, index)
})

const surveyOffset = {
  tasteScore: 19, tasteImp: 20, priceScore: 21, priceImp: 22, serviceScore: 23, serviceImp: 24,
  orderingScore: 25, orderingImp: 26, ambienceScore: 27, ambienceImp: 28, varietyScore: 29, varietyImp: 30,
  promoScore: 31, promoImp: 32, locationScore: 33, locationImp: 34, appScore: 35, appImp: 36,
  parkingScore: 37, parkingImp: 38, surveyCount: 39, wouldRecommend: 40,
}

await readCsv('survey_responses.csv', (row) => {
  const index = customerMap.get(row.CustomerID)
  const target = customerRows[index]
  if (!target) return
  target[surveyOffset.tasteScore] += +row.Score_taste
  target[surveyOffset.tasteImp] += +row.Importance_taste
  target[surveyOffset.priceScore] += +row.Score_price
  target[surveyOffset.priceImp] += +row.Importance_price
  target[surveyOffset.serviceScore] += +row.Score_service
  target[surveyOffset.serviceImp] += +row.Importance_service
  target[surveyOffset.orderingScore] += +row.Score_ordering
  target[surveyOffset.orderingImp] += +row.Importance_ordering
  target[surveyOffset.ambienceScore] += +row.Score_ambience
  target[surveyOffset.ambienceImp] += +row.Importance_ambience
  target[surveyOffset.varietyScore] += +row.Score_variety
  target[surveyOffset.varietyImp] += +row.Importance_variety
  target[surveyOffset.promoScore] += +row.Score_promo
  target[surveyOffset.promoImp] += +row.Importance_promo
  target[surveyOffset.locationScore] += +row.Score_location
  target[surveyOffset.locationImp] += +row.Importance_location
  target[surveyOffset.appScore] += +row.Score_app
  target[surveyOffset.appImp] += +row.Importance_app
  target[surveyOffset.parkingScore] += +row.Score_parking
  target[surveyOffset.parkingImp] += +row.Importance_parking
  target[surveyOffset.surveyCount] += 1
  target[surveyOffset.wouldRecommend] += +row.WouldRecommend
})

for (const row of customerRows) {
  const count = row[surveyOffset.surveyCount] || 1
  for (let i = surveyOffset.tasteScore; i <= surveyOffset.parkingImp; i += 1) row[i] = Math.round((row[i] / count) * 100)
  row[surveyOffset.wouldRecommend] = Math.round((row[surveyOffset.wouldRecommend] / count) * 100)
}

const transactionMeta = new Map()
const monthly = new Map()
await readCsv('transactions.csv', (row) => {
  const customer = customerMap.get(row.CustomerID)
  if (customer === undefined) return
  const month = months.id(row.Date.slice(0, 7))
  const channel = channels.id(row.Channel)
  const key = `${customer}|${month}|${channel}`
  const cell = monthly.get(key) ?? {
    customer, month, channel, tx: 0, net: 0, voucher: 0, campaign: 0, memberTx: 0,
    morning: 0, delivery: 0, wait: 0, sat: 0, items: 0, coffeeQty: 0, snackQty: 0,
  }
  cell.tx += 1
  cell.net += +row.NetAmount
  if (row.VoucherCode) cell.voucher += 1
  if (row.CampaignID) cell.campaign += 1
  cell.memberTx += +row.IsMemberTransaction
  if (row.DayPart === 'Pagi') cell.morning += 1
  if (['GrabFood', 'GoFood', 'ShopeeFood', 'Aplikasi Kopi Kenangan'].includes(row.Channel)) cell.delivery += 1
  cell.wait += +row.WaitMinutes
  cell.sat += +row.SatisfactionScore
  monthly.set(key, cell)
  transactionMeta.set(row.TransactionID, { customer, month, channel, key })
})

await readCsv('transaction_items.csv', (row) => {
  const meta = transactionMeta.get(row.TransactionID)
  if (!meta || +row.Qty <= 0) return
  const cell = monthly.get(meta.key)
  if (!cell) return
  cell.items += +row.Qty
  if (row.Category === 'Coffee') cell.coffeeQty += +row.Qty
  if (row.Category === 'Snack') cell.snackQty += +row.Qty
})

const customerMotivationMonthly = [...monthly.values()]
  .sort((a, b) => a.customer - b.customer || a.month - b.month || a.channel - b.channel)
  .map((cell) => [
    cell.customer, cell.month, cell.channel, cell.tx, Math.round(cell.net), cell.voucher, cell.campaign,
    cell.memberTx, cell.morning, cell.delivery, Math.round(cell.wait * 10), Math.round(cell.sat * 100),
    cell.items, cell.coffeeQty, cell.snackQty,
  ])

const payload = {
  meta: {
    source: 'scripts/build-customer-motivation.mjs',
    generatedAt: '2026-06-15',
    customers: customerRows.length,
    methodology: [
      'Dataset does not include explicit purchase-reason fields; motivation is derived from survey attribute importance/performance plus compact behavioural proxies.',
      'Survey attributes are observed responses. Loyalty, voucher, daypart, product/category preference, and frequency are behavioural proxies.',
      'Motivation scores are evidence indices for analysis, not definitive psychological statements.',
      'Global quarter filtering uses customer-month behaviour while survey/customer profile signals remain customer-level evidence.',
    ],
  },
  dims: {
    months: months.values,
    outlets,
    genders: genders.values,
    ageBands: ageBands.values,
    segments: segments.values,
    occupations: occupations.values,
    acquisitions: acquisitions.values,
    channels: channels.values,
    categories: categories.values,
    products,
  },
  // [outlet, gender, age, segment, occupation, acquisition, member, visits, netSpend, avgBasket, voucherUses, deliveryShareX100, avgSatX100, nps, recency, freqX100, clv, favoriteCategory, favoriteProduct, tasteScoreX100, tasteImpX100, priceScoreX100, priceImpX100, serviceScoreX100, serviceImpX100, orderingScoreX100, orderingImpX100, ambienceScoreX100, ambienceImpX100, varietyScoreX100, varietyImpX100, promoScoreX100, promoImpX100, locationScoreX100, locationImpX100, appScoreX100, appImpX100, parkingScoreX100, parkingImpX100, surveyCount, wouldRecommendX100]
  customerMotivation: customerRows,
  // [customer, month, channel, tx, net, voucherTx, campaignTx, memberTx, morningTx, deliveryTx, waitSumX10, satSumX100, itemQty, coffeeQty, snackQty]
  customerMotivationMonthly,
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))
console.log(`wrote ${OUT_FILE}  ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`)
console.log(`  customers              ${customerRows.length.toLocaleString('en-US')}`)
console.log(`  customer-month-channel ${customerMotivationMonthly.length.toLocaleString('en-US')}`)
