/**
 * Rolls the raw export into the semantic layer the dashboard queries.
 *
 * The browser never sees 204k transactions. It gets a small star-schema cube:
 *
 *   facts[]      one cell per month × outlet × gender × age band, additive
 *                measures only — so any filter combination re-aggregates
 *                exactly, the way a BI tool would.
 *   customers[]  one compact row per customer, because distinct counts,
 *                retention and CLV are not additive and must be recomputed
 *                over the filtered population.
 *
 * Everything else (needs, channels, categories, day-part heatmap, media) is a
 * narrow fact table keyed on the same dimensions.
 *
 *   node scripts/build-aggregates.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const IN_DIR = 'data'
const OUT_FILE = path.join('src', 'data', 'insights.json')

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

/** Interning helper: keeps the JSON small by replacing labels with indices. */
function dimension() {
  const index = new Map()
  const values = []
  return {
    id(value) {
      if (!index.has(value)) {
        index.set(value, values.length)
        values.push(value)
      }
      return index.get(value)
    },
    values,
  }
}

// ── dimensions ───────────────────────────────────────────────────
const outletRows = []
await readCsv('outlets.csv', (r) => outletRows.push(r))
const outletIndex = new Map(outletRows.map((o, i) => [o.OutletID, i]))
const outlets = outletRows.map((o) => ({
  id: o.OutletID,
  name: o.OutletName,
  city: o.City,
  region: o.RegionName,
  type: o.OutletType,
}))

const productRows = []
await readCsv('products.csv', (r) => productRows.push(r))
const productIndex = new Map(productRows.map((p, i) => [p.ProductID, i]))
const products = productRows.map((p) => ({
  id: p.ProductID,
  name: p.ProductName,
  category: p.Category,
  basePrice: Math.round(+p.BasePrice),
}))

const months = dimension()
const genders = dimension()
const ageBands = dimension()
const segments = dimension()
const channels = dimension()
const categories = dimension()
const dayParts = dimension()
const campaigns = dimension()
const attributes = dimension()
const acquisitions = dimension()
const googleKeywords = dimension()
const googleMatchTypes = dimension()
const googleDevices = dimension()
const googleLocations = dimension()
const googleAgeRanges = dimension()
const googleGenders = dimension()
const metaLocations = dimension()
const metaAgeRanges = dimension()
const metaGenders = dimension()
const youtubeLocations = dimension()
const youtubeAgeRanges = dimension()
const youtubeGenders = dimension()

// Fixed order keeps the JSON stable and lets the UI trust the index order.
for (let y = 2025, m = 7; !(y === 2026 && m === 7); m += 1) {
  if (m > 12) { m = 1; y += 1 }
  months.id(`${y}-${String(m).padStart(2, '0')}`)
}
for (const g of ['Female', 'Male']) genders.id(g)
for (const a of ['18-24', '25-35', '36-45', '46+']) ageBands.id(a)
for (const c of ['Coffee', 'Non Coffee', 'Snack']) categories.id(c)
for (const d of ['Pagi', 'Siang', 'Sore', 'Malam']) dayParts.id(d)
for (const c of ['Dine In', 'Take Away', 'GrabFood', 'GoFood', 'ShopeeFood', 'Aplikasi Kopi Kenangan']) channels.id(c)
for (const s of ['Champion', 'Loyal', 'Potential', 'New', 'At Risk', 'Hibernating']) segments.id(s)
for (const a of ['taste', 'price', 'service', 'ordering', 'ambience', 'variety', 'promo', 'location', 'app', 'parking']) attributes.id(a)

// ── customer rows ────────────────────────────────────────────────
const customerMeta = new Map()
const customerRows = []
const customerJourneyRows = []
const customerJourneyMeta = new Map()
const dayNumber = (value) => value ? Math.floor(Date.parse(value + 'T00:00:00Z') / 86400000) : -1
const ymNumber = (value) => value ? +value.replace('-', '') : -1
await readCsv('customers.csv', (r) => {
  const row = [
    outletIndex.get(r.HomeOutletID),
    genders.id(r.Gender),
    ageBands.id(r.AgeBand),
    segments.id(r.Segment),
    +r.Visits,
    Math.round(+r.NetSpend),
    r.NPS === '' ? -1 : +r.NPS,
    Math.round(+r.AvgSatisfaction * 100),
    +r.IsMember,
    r.Status === 'Active' ? 1 : 0,
    Math.round(+r.CLV),
    Math.round(+r.FrequencyPerMonth * 100),
    +r.RecencyDays,
    acquisitions.id(r.AcquisitionChannel),
  ]
  const index = customerRows.length
  customerRows.push(row)
  customerJourneyRows.push([
    row[0], row[1], row[2], row[3], row[8], row[13],
    dayNumber(r.SignupDate), ymNumber(r.CohortMonth), dayNumber(r.MemberSince),
    +r.Visits, Math.round(+r.NetSpend), Math.round(+r.CLV), +r.RecencyDays,
    Math.round(+r.AvgSatisfaction * 100), r.NPS === '' ? -1 : +r.NPS,
    -1, -1, -1, 0, 0, 0, 0,
  ])
  customerMeta.set(r.CustomerID, { index, gender: row[1], age: row[2], segment: row[3], member: row[8], visits: +r.Visits })
  customerJourneyMeta.set(r.CustomerID, {
    index,
    outlet: row[0],
    gender: row[1],
    age: row[2],
    segment: row[3],
    member: row[8],
    purchaseDays: [],
    activeMonths: new Set(),
    voucherTx: 0,
    memberTx: 0,
  })
})

// ── transaction facts ────────────────────────────────────────────
// Additive measures only; anything ratio-like is derived at query time.
const facts = new Map()
// Distinct-customer activity per period: without this, filtering by month
// would leave repeat rate, frequency and active-base KPIs frozen.
const activity = new Map()
const channelMix = new Map()
const hourly = new Map()
const monthlySeries = new Map()
const transactionMeta = new Map()
const customerJourneyMonthly = new Map()

const factKey = (m, o, g, a) => `${m}|${o}|${g}|${a}`

await readCsv('transactions.csv', (r) => {
  const meta = customerMeta.get(r.CustomerID)
  if (!meta) return
  const m = months.id(r.Date.slice(0, 7))
  const o = outletIndex.get(r.OutletID)
  const channel = channels.id(r.Channel)
  const dayPart = dayParts.id(r.DayPart)
  const key = factKey(m, o, meta.gender, meta.age)

  let cell = facts.get(key)
  if (!cell) {
    cell = { m, o, g: meta.gender, a: meta.age, tx: 0, net: 0, gross: 0, disc: 0, items: 0, wait: 0, sat: 0, member: 0, voucher: 0 }
    facts.set(key, cell)
  }
  cell.tx += 1
  cell.net += +r.NetAmount
  cell.gross += +r.GrossAmount
  cell.disc += +r.DiscountAmount
  cell.items += +r.ItemCount
  cell.wait += +r.WaitMinutes
  cell.sat += +r.SatisfactionScore
  cell.member += +r.IsMemberTransaction
  if (r.VoucherCode) cell.voucher += 1

  const chKey = `${m}|${o}|${channel}`
  const ch = channelMix.get(chKey) ?? { m, o, c: channel, tx: 0, net: 0 }
  ch.tx += 1
  ch.net += +r.NetAmount
  channelMix.set(chKey, ch)

  const dow = new Date(r.Date + 'T00:00:00Z').getUTCDay()
  const hKey = `${o}|${dow}|${r.Hour}`
  const h = hourly.get(hKey) ?? { o, d: dow, h: +r.Hour, tx: 0, wait: 0 }
  h.tx += 1
  h.wait += +r.WaitMinutes
  hourly.set(hKey, h)

  const aKey = `${m}|${o}|${meta.gender}|${meta.age}`
  let act = activity.get(aKey)
  if (!act) {
    act = { m, o, g: meta.gender, a: meta.age, seen: new Map() }
    activity.set(aKey, act)
  }
  act.seen.set(r.CustomerID, (act.seen.get(r.CustomerID) ?? 0) + 1)

  const ms = monthlySeries.get(m) ?? { m, tx: 0, net: 0 }
  ms.tx += 1
  ms.net += +r.NetAmount
  monthlySeries.set(m, ms)

  const journey = customerJourneyMeta.get(r.CustomerID)
  if (journey) {
    const txDay = dayNumber(r.Date)
    journey.purchaseDays.push(txDay)
    journey.activeMonths.add(m)
    if (r.VoucherCode) journey.voucherTx += 1
    journey.memberTx += +r.IsMemberTransaction

    const cjKey = `${journey.index}|${m}|${channel}`
    const cj = customerJourneyMonthly.get(cjKey) ?? {
      customer: journey.index,
      outlet: journey.outlet,
      gender: journey.gender,
      age: journey.age,
      segment: journey.segment,
      month: m,
      channel,
      tx: 0,
      net: 0,
      voucher: 0,
      memberTx: 0,
      campaign: 0,
      sat: 0,
    }
    cj.tx += 1
    cj.net += +r.NetAmount
    if (r.VoucherCode) cj.voucher += 1
    cj.memberTx += +r.IsMemberTransaction
    if (r.CampaignID) cj.campaign += 1
    cj.sat += +r.SatisfactionScore
    customerJourneyMonthly.set(cjKey, cj)
  }

  transactionMeta.set(r.TransactionID, {
    m,
    o,
    g: meta.gender,
    a: meta.age,
    s: meta.segment,
    c: channel,
    member: +r.IsMemberTransaction,
    voucher: r.VoucherCode ? 1 : 0,
    dayPart,
    weekend: dow === 0 || dow === 6 ? 1 : 0,
    net: +r.NetAmount,
    gross: +r.GrossAmount,
    discount: +r.DiscountAmount,
  })
})

for (const meta of customerJourneyMeta.values()) {
  const row = customerJourneyRows[meta.index]
  if (!row) continue
  meta.purchaseDays.sort((a, b) => a - b)
  row[15] = meta.purchaseDays[0] ?? -1
  row[16] = meta.purchaseDays[1] ?? -1
  row[17] = meta.purchaseDays.at(-1) ?? -1
  row[18] = meta.purchaseDays.length
  row[19] = meta.voucherTx
  row[20] = meta.memberTx
  row[21] = meta.activeMonths.size
}

// ── category mix ─────────────────────────────────────────────────
const txMonthOutlet = new Map()
await readCsv('transactions.csv', (r) => {
  txMonthOutlet.set(r.TransactionID, [months.id(r.Date.slice(0, 7)), outletIndex.get(r.OutletID)])
})
const categoryMix = new Map()
await readCsv('transaction_items.csv', (r) => {
  const ref = txMonthOutlet.get(r.TransactionID)
  if (!ref) return
  const c = categories.id(r.Category)
  const key = `${ref[0]}|${ref[1]}|${c}`
  const cell = categoryMix.get(key) ?? { m: ref[0], o: ref[1], c, qty: 0, amount: 0 }
  cell.qty += +r.Qty
  cell.amount += +r.LineAmount
  categoryMix.set(key, cell)
})
txMonthOutlet.clear()

// â”€â”€ market basket compact aggregate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Support/confidence/lift must be recomputed after filters, so the browser gets
// additive cells by basket dimensions rather than pre-filtered association rows.
const itemsByTx = new Map()
await readCsv('transaction_items.csv', (r) => {
  const meta = transactionMeta.get(r.TransactionID)
  const product = productIndex.get(r.ProductID)
  if (!meta || product === undefined || +r.Qty <= 0) return
  const list = itemsByTx.get(r.TransactionID) ?? []
  list.push({ p: product, qty: +r.Qty, amount: +r.LineAmount })
  itemsByTx.set(r.TransactionID, list)
})

const mbTransactions = new Map()
const mbProducts = new Map()
const mbPairs = new Map()
const basketKey = (meta) => `${meta.m}|${meta.o}|${meta.g}|${meta.a}|${meta.s}|${meta.c}|${meta.member}|${meta.voucher}|${meta.dayPart}|${meta.weekend}`
const addMbTransaction = (meta, uniqueCount, qty) => {
  const key = basketKey(meta)
  const cell = mbTransactions.get(key) ?? { ...meta, tx: 0, multi: 0, unique: 0, qty: 0, net: 0, gross: 0, discount: 0 }
  cell.tx += 1
  if (uniqueCount >= 2) cell.multi += 1
  cell.unique += uniqueCount
  cell.qty += qty
  cell.net += meta.net
  cell.gross += meta.gross
  cell.discount += meta.discount
  mbTransactions.set(key, cell)
}

const addMbProduct = (meta, product, qty, amount) => {
  const key = `${basketKey(meta)}|${product}`
  const cell = mbProducts.get(key) ?? { ...meta, p: product, tx: 0, qty: 0, itemRevenue: 0, basketRevenue: 0 }
  cell.tx += 1
  cell.qty += qty
  cell.itemRevenue += amount
  cell.basketRevenue += meta.net
  mbProducts.set(key, cell)
}

const addMbPair = (meta, a, b, qty, itemRevenue) => {
  const left = Math.min(a, b)
  const right = Math.max(a, b)
  const key = `${basketKey(meta)}|${left}|${right}`
  const cell = mbPairs.get(key) ?? { ...meta, pA: left, pB: right, tx: 0, qty: 0, itemRevenue: 0, basketRevenue: 0, discount: 0 }
  cell.tx += 1
  cell.qty += qty
  cell.itemRevenue += itemRevenue
  cell.basketRevenue += meta.net
  cell.discount += meta.discount
  mbPairs.set(key, cell)
}

for (const [txId, items] of itemsByTx) {
  const meta = transactionMeta.get(txId)
  if (!meta) continue
  const byProduct = new Map()
  for (const item of items) {
    const current = byProduct.get(item.p) ?? { qty: 0, amount: 0 }
    current.qty += item.qty
    current.amount += item.amount
    byProduct.set(item.p, current)
  }
  const productsInBasket = [...byProduct.keys()].sort((a, b) => a - b)
  const qty = [...byProduct.values()].reduce((sum, item) => sum + item.qty, 0)
  addMbTransaction(meta, productsInBasket.length, qty)
  for (const [product, item] of byProduct) addMbProduct(meta, product, item.qty, item.amount)
  for (let i = 0; i < productsInBasket.length; i += 1) {
    for (let j = i + 1; j < productsInBasket.length; j += 1) {
      const a = productsInBasket[i]
      const b = productsInBasket[j]
      const left = byProduct.get(a)
      const right = byProduct.get(b)
      addMbPair(meta, a, b, (left?.qty ?? 0) + (right?.qty ?? 0), (left?.amount ?? 0) + (right?.amount ?? 0))
    }
  }
}

const marketBasketBaskets = []
for (const [txId, items] of itemsByTx) {
  const meta = transactionMeta.get(txId)
  if (!meta) continue
  const byProduct = new Map()
  for (const item of items) {
    const current = byProduct.get(item.p) ?? { qty: 0, amount: 0 }
    current.qty += item.qty
    current.amount += item.amount
    byProduct.set(item.p, current)
  }
  const encodedItems = [...byProduct.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([product, item]) => `${product}:${item.qty}:${Math.round(item.amount)}`)
    .join(',')
  const uniqueCount = byProduct.size
  const qty = [...byProduct.values()].reduce((sum, item) => sum + item.qty, 0)
  marketBasketBaskets.push([
    meta.m, meta.o, meta.g, meta.a, meta.s, meta.c, meta.member, meta.voucher, meta.dayPart,
    meta.weekend, Math.round(meta.net), Math.round(meta.gross), Math.round(meta.discount), uniqueCount, qty, encodedItems,
  ])
}

// ── survey: needs, NPS, satisfaction by slice ────────────────────
const needs = new Map()
const surveyFacts = new Map()
await readCsv('survey_responses.csv', (r) => {
  const o = outletIndex.get(r.OutletID)
  const g = genders.id(r.Gender)
  const a = ageBands.id(r.AgeBand)

  const sKey = `${o}|${g}|${a}`
  const s = surveyFacts.get(sKey) ?? { o, g, a, n: 0, sat: 0, nps: 0, promoters: 0, detractors: 0 }
  s.n += 1
  s.sat += +r.OverallSatisfaction
  s.nps += +r.NPS
  if (r.NPSGroup === 'Promoter') s.promoters += 1
  if (r.NPSGroup === 'Detractor') s.detractors += 1
  surveyFacts.set(sKey, s)

  for (const key of Object.keys(r)) {
    if (!key.startsWith('Score_')) continue
    const attrKey = key.slice(6)
    const attr = attributes.id(attrKey)
    const nKey = `${o}|${attr}`
    const cell = needs.get(nKey) ?? { o, attr, n: 0, perf: 0, imp: 0, low: 0, high: 0, visitsLow: 0, visitsHigh: 0, nLow: 0, nHigh: 0 }
    const score = +r[key]
    cell.n += 1
    cell.perf += score
    cell.imp += +r['Importance_' + attrKey]
    // Score distribution plus the visit behaviour behind it: this is what turns
    // "gap" into a measured "% pelanggan terdampak" and a repeat-purchase delta.
    const visits = customerMeta.get(r.CustomerID)?.visits ?? 0
    if (score <= 3) { cell.low += 1; cell.visitsLow += visits; cell.nLow += 1 }
    else { cell.visitsHigh += visits; cell.nHigh += 1 }
    if (score >= 4.5) cell.high += 1
    needs.set(nKey, cell)
  }
})

// ── media ────────────────────────────────────────────────────────
const media = new Map()
const googleAds = new Map()
const metaAds = new Map()
const youtubeAds = new Map()
const mediaKey = (m, c) => `${m}|${c}`
const googleAdsKey = (m, c, k, mt, d, l, a, g) => `${m}|${c}|${k}|${mt}|${d}|${l}|${a}|${g}`
const metaAdsKey = (m, c, l, a, g) => `${m}|${c}|${l}|${a}|${g}`
const youtubeAdsKey = (m, c, l, a, g) => `${m}|${c}|${l}|${a}|${g}`
const addMedia = (month, campaignId, patch) => {
  const m = months.id(month)
  const c = campaigns.id(campaignId)
  const key = mediaKey(m, c)
  const cell = media.get(key) ?? { m, c, spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0, reach: 0, views: 0 }
  for (const [field, amount] of Object.entries(patch)) cell[field] += amount
  media.set(key, cell)
}

await readCsv('google_ads_performance.csv', (r) => {
  addMedia(r.Date.slice(0, 7), r.CampaignID, {
    spend: +r.Cost, impressions: +r.Impressions, clicks: +r.Clicks, conversions: +r.Conversions, value: +r.ConversionValue,
  })

  const m = months.id(r.Date.slice(0, 7))
  const c = campaigns.id(r.CampaignID)
  const k = googleKeywords.id(`${r.KeywordID}|${r.Keyword}`)
  const mt = googleMatchTypes.id(r.MatchType)
  const d = googleDevices.id(r.Device)
  const l = googleLocations.id(r.Location)
  const a = googleAgeRanges.id(r.AgeRange)
  const g = googleGenders.id(r.Gender)
  const key = googleAdsKey(m, c, k, mt, d, l, a, g)
  const cell = googleAds.get(key) ?? { m, c, k, mt, d, l, a, g, spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0 }
  cell.spend += +r.Cost
  cell.impressions += +r.Impressions
  cell.clicks += +r.Clicks
  cell.conversions += +r.Conversions
  cell.value += +r.ConversionValue
  googleAds.set(key, cell)
})
await readCsv('meta_ads_performance.csv', (r) => {
  addMedia(r.Date.slice(0, 7), r.CampaignID, {
    spend: +r.Spend, impressions: +r.Impressions, clicks: +r.Clicks, conversions: +r.Conversions, reach: +r.Reach, views: +r.VideoViews,
  })

  const m = months.id(r.Date.slice(0, 7))
  const c = campaigns.id(r.CampaignID)
  const l = metaLocations.id(r.Location)
  const a = metaAgeRanges.id(r.AgeRange)
  const g = metaGenders.id(r.Gender)
  const key = metaAdsKey(m, c, l, a, g)
  const cell = metaAds.get(key) ?? { m, c, l, a, g, spend: 0, reach: 0, impressions: 0, clicks: 0, engagement: 0, views: 0, conversions: 0 }
  cell.spend += +r.Spend
  cell.reach += +r.Reach
  cell.impressions += +r.Impressions
  cell.clicks += +r.Clicks
  cell.engagement += +r.Engagement
  cell.views += +r.VideoViews
  cell.conversions += +r.Conversions
  metaAds.set(key, cell)
})
await readCsv('youtube_ads_performance.csv', (r) => {
  addMedia(r.Date.slice(0, 7), r.CampaignID, {
    spend: +r.Spend, impressions: +r.Impressions, clicks: +r.Clicks, conversions: +r.Conversions, views: +r.Views,
  })

  const m = months.id(r.Date.slice(0, 7))
  const c = campaigns.id(r.CampaignID)
  const l = youtubeLocations.id(r.Location)
  const a = youtubeAgeRanges.id(r.AgeRange)
  const g = youtubeGenders.id(r.Gender)
  const key = youtubeAdsKey(m, c, l, a, g)
  const views = +r.Views
  const cell = youtubeAds.get(key) ?? {
    m,
    c,
    l,
    a,
    g,
    spend: 0,
    impressions: 0,
    views: 0,
    watchTimeSeconds: 0,
    completedViews: 0,
    clicks: 0,
    conversions: 0,
  }
  cell.spend += +r.Spend
  cell.impressions += +r.Impressions
  cell.views += views
  cell.watchTimeSeconds += Math.round(+r.WatchTimeHours * 3600)
  cell.completedViews += Math.round(views * (+r.CompletionRatePct / 100))
  cell.clicks += +r.Clicks
  cell.conversions += +r.Conversions
  youtubeAds.set(key, cell)
})

const campaignMeta = new Map()
await readCsv('campaigns.csv', (r) => campaignMeta.set(r.CampaignID, { name: r.CampaignName, platform: r.Platform, objective: r.Objective }))

// ── emit ─────────────────────────────────────────────────────────
const round = (value) => Math.round(value)

const payload = {
  meta: {
    source: 'scripts/generate-dataset.mjs',
    seed: 20260615,
    period: { start: '2025-07-01', end: '2026-06-15' },
    transactions: [...facts.values()].reduce((sum, c) => sum + c.tx, 0),
    customers: customerRows.length,
  },
  dims: {
    months: months.values,
    outlets,
    genders: genders.values,
    ageBands: ageBands.values,
    segments: segments.values,
    channels: channels.values,
    categories: categories.values,
    dayParts: dayParts.values,
    products,
    attributes: attributes.values,
    acquisitions: acquisitions.values,
    campaigns: campaigns.values.map((id) => ({ id, ...campaignMeta.get(id) })),
    googleKeywords: googleKeywords.values.map((value) => {
      const [id, term] = value.split('|')
      return { id, term }
    }),
    googleMatchTypes: googleMatchTypes.values,
    googleDevices: googleDevices.values,
    googleLocations: googleLocations.values,
    googleAgeRanges: googleAgeRanges.values,
    googleGenders: googleGenders.values,
    metaLocations: metaLocations.values,
    metaAgeRanges: metaAgeRanges.values,
    metaGenders: metaGenders.values,
    youtubeLocations: youtubeLocations.values,
    youtubeAgeRanges: youtubeAgeRanges.values,
    youtubeGenders: youtubeGenders.values,
  },
  // [month, outlet, gender, age, tx, net, gross, discount, items, waitSum, satSum, memberTx, voucherTx]
  facts: [...facts.values()].map((c) => [c.m, c.o, c.g, c.a, c.tx, round(c.net), round(c.gross), round(c.disc), c.items, round(c.wait), round(c.sat), c.member, c.voucher]),
  // [outlet, gender, age, segment, visits, netSpend, nps, satX100, isMember, isActive, clv, freqX100, recency, acquisition]
  customers: customerRows,
  // [month, outlet, gender, age, activeCustomers, repeatCustomers]
  activity: [...activity.values()].map((c) => {
    let repeat = 0
    for (const count of c.seen.values()) if (count >= 2) repeat += 1
    return [c.m, c.o, c.g, c.a, c.seen.size, repeat]
  }),
  // [outlet, gender, age, n, satSum, npsSum, promoters, detractors]
  survey: [...surveyFacts.values()].map((s) => [s.o, s.g, s.a, s.n, round(s.sat * 100), s.nps, s.promoters, s.detractors]),
  // [outlet, attribute, n, perfSumX100, impSumX100, lowScorers, highScorers, visitsLow, nLow, visitsHigh, nHigh]
  needs: [...needs.values()].map((c) => [
    c.o, c.attr, c.n, round(c.perf * 100), round(c.imp * 100),
    c.low, c.high, c.visitsLow, c.nLow, c.visitsHigh, c.nHigh,
  ]),
  // [month, outlet, channel, tx, net]
  channelMix: [...channelMix.values()].map((c) => [c.m, c.o, c.c, c.tx, round(c.net)]),
  // [month, outlet, category, qty, amount]
  categoryMix: [...categoryMix.values()].map((c) => [c.m, c.o, c.c, c.qty, round(c.amount)]),
  // [outlet, dayOfWeek, hour, tx, waitSum]
  hourly: [...hourly.values()].map((c) => [c.o, c.d, c.h, c.tx, round(c.wait)]),
  // [month, campaign, spend, impressions, clicks, conversions, value, reach, views]
  media: [...media.values()].map((c) => [c.m, c.c, round(c.spend), c.impressions, c.clicks, c.conversions, round(c.value), c.reach, c.views]),
  // [month, campaign, keyword, matchType, device, location, ageRange, gender, spend, impressions, clicks, conversions, value]
  googleAds: [...googleAds.values()].map((c) => [c.m, c.c, c.k, c.mt, c.d, c.l, c.a, c.g, round(c.spend), c.impressions, c.clicks, c.conversions, round(c.value)]),
  // [month, campaign, location, ageRange, gender, spend, reach, impressions, clicks, engagement, videoViews, conversions]
  metaAds: [...metaAds.values()].map((c) => [c.m, c.c, c.l, c.a, c.g, round(c.spend), c.reach, c.impressions, c.clicks, c.engagement, c.views, c.conversions]),
  // [month, campaign, location, ageRange, gender, spend, impressions, views, watchTimeSeconds, completedViews, clicks, conversions]
  youtubeAds: [...youtubeAds.values()].map((c) => [c.m, c.c, c.l, c.a, c.g, round(c.spend), c.impressions, c.views, c.watchTimeSeconds, c.completedViews, c.clicks, c.conversions]),
  // [month, tx, net]
  monthly: [...monthlySeries.values()].sort((a, b) => a.m - b.m).map((c) => [c.m, c.tx, round(c.net)]),
  // [outlet, gender, age, segment, member, acquisition, signupDay, cohortYm, memberSinceDay, visits, netSpend, clv, recency, avgSatX100, nps, firstPurchaseDay, secondPurchaseDay, lastPurchaseDay, totalTx, voucherTx, memberTx, activeMonths]
  customerJourney: customerJourneyRows,
  // [customer, outlet, gender, age, segment, month, channel, tx, net, voucherTx, memberTx, campaignTx, satSumX100]
  customerJourneyMonthly: [...customerJourneyMonthly.values()]
    .sort((a, b) => a.customer - b.customer || a.month - b.month || a.channel - b.channel)
    .map((c) => [c.customer, c.outlet, c.gender, c.age, c.segment, c.month, c.channel, c.tx, round(c.net), c.voucher, c.memberTx, c.campaign, round(c.sat * 100)]),
  // [month, outlet, gender, age, segment, channel, member, voucher, dayPart, weekend, net, gross, discount, uniqueProductCount, quantitySum, encodedItems]
  marketBasketBaskets,
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))

const kb = (bytes) => (bytes / 1024).toFixed(0) + ' KB'
console.log(`wrote ${OUT_FILE}  ${kb(fs.statSync(OUT_FILE).size)}`)
for (const [name, rows] of Object.entries(payload)) {
  if (Array.isArray(rows)) console.log(`  ${name.padEnd(14)} ${rows.length.toLocaleString('en-US').padStart(7)} rows`)
}
