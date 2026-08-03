/**
 * Synthetic production dataset for the Kopi Kenangan customer-insight estate.
 *
 * This is a simulation, not a random fill. Entities are generated in causal
 * order and each stage feeds the next:
 *
 *   calendar ─► media plan ─► acquisition ─► customers
 *        └──────────────┬─────────────────────┘
 *                       ▼
 *                  visit sequence  ─►  waiting time ─► satisfaction
 *                       │                                   │
 *                       ├──► basket / discount / payment     ├──► churn hazard
 *                       └──► loyalty points / tier           └──► survey + NPS
 *
 * Every relationship the brief asks for is an explicit term in the model, so
 * slicing the result by outlet, city, quarter, gender or age moves the KPIs the
 * way it would in a real warehouse.
 *
 *   node scripts/generate-dataset.mjs [--seed 20260615] [--out data]
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRng, makeSampler, clamp, logistic, roundRupiah } from './lib/stats.mjs'
import {
  PERIOD_START,
  PERIOD_END,
  REGIONS,
  OUTLET_TYPES,
  OUTLETS,
  PRODUCTS,
  CITY_PRICE_INDEX,
  AGE_BANDS,
  OCCUPATION_BY_AGE,
  INCOME_PARAMS,
  PAYMENT_METHODS,
  CHANNELS,
  SURVEY_ATTRIBUTES,
  CAMPAIGNS,
  KEYWORDS,
  DEVICES,
  AD_LOCATIONS,
} from './lib/reference.mjs'

// ── CLI ──────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag)
  return i === -1 ? fallback : args[i + 1]
}
const SEED = Number(argOf('--seed', 20260615))
const OUT_DIR = argOf('--out', 'data')
const TARGET_CUSTOMERS = 12845

const rng = createRng(SEED)
const S = makeSampler(rng)

// ── CSV writer ───────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true })

function csvWriter(file, header) {
  const stream = fs.createWriteStream(path.join(OUT_DIR, file), { encoding: 'utf8' })
  stream.write(header.join(',') + '\n')
  let buffer = []
  let rows = 0
  return {
    row(values) {
      buffer.push(values.join(','))
      rows += 1
      if (buffer.length >= 5000) {
        stream.write(buffer.join('\n') + '\n')
        buffer = []
      }
    },
    async close() {
      if (buffer.length) stream.write(buffer.join('\n') + '\n')
      await new Promise((resolve) => stream.end(resolve))
      return rows
    },
  }
}

// ── Calendar ─────────────────────────────────────────────────────
const DAY_MS = 86_400_000
const startDate = new Date(PERIOD_START + 'T00:00:00Z')
const endDate = new Date(PERIOD_END + 'T00:00:00Z')
const TOTAL_DAYS = Math.round((endDate - startDate) / DAY_MS) + 1

const iso = (date) => date.toISOString().slice(0, 10)
const dayDate = (index) => new Date(startDate.getTime() + index * DAY_MS)

// Ramadan 1447H and Idul Fitri fall inside the simulated year.
const RAMADAN_START = '2026-02-18'
const RAMADAN_END = '2026-03-19'
const LEBARAN = ['2026-03-20', '2026-03-21', '2026-03-22']
const NATIONAL_HOLIDAYS = new Set([
  '2025-08-17', '2025-09-05', '2025-12-25', '2026-01-01', '2026-01-29',
  '2026-03-19', '2026-04-03', '2026-05-01', '2026-05-14', '2026-06-01',
  ...LEBARAN,
])

const DOW_FACTOR = [1.19, 0.86, 0.89, 0.93, 1.0, 1.16, 1.31] // Sun..Sat
// Coffee demand dips in the fasting month, then spikes on Lebaran week.
const MONTH_FACTOR = {
  '2025-07': 1.02, '2025-08': 1.0, '2025-09': 0.98, '2025-10': 1.01,
  '2025-11': 1.04, '2025-12': 1.12, '2026-01': 0.96, '2026-02': 0.93,
  '2026-03': 0.9, '2026-04': 1.08, '2026-05': 1.05, '2026-06': 1.03,
}

const calendar = []
for (let i = 0; i < TOTAL_DAYS; i += 1) {
  const date = dayDate(i)
  const key = iso(date)
  const month = key.slice(0, 7)
  const dow = date.getUTCDay()
  const dom = date.getUTCDate()
  const inRamadan = key >= RAMADAN_START && key <= RAMADAN_END
  const isLebaran = LEBARAN.includes(key)
  const isHoliday = NATIONAL_HOLIDAYS.has(key)

  // Payday cycle: Indonesian salaries land on the 25th, spending runs to the 2nd.
  const payday = dom >= 25 || dom <= 2 ? 1.09 : dom >= 18 && dom <= 24 ? 0.94 : 1.0

  let factor = DOW_FACTOR[dow] * (MONTH_FACTOR[month] ?? 1) * payday
  if (inRamadan) factor *= 0.82
  if (isLebaran) factor *= 1.42
  if (isHoliday && !isLebaran) factor *= 1.12

  calendar.push({ index: i, date: key, month, quarter: quarterOf(key), dow, factor, inRamadan, isHoliday })
}

function quarterOf(dateKey) {
  const [year, month] = dateKey.split('-').map(Number)
  return `${year}-Q${Math.ceil(month / 3)}`
}

const dayByDate = new Map(calendar.map((day) => [day.date, day]))
const months = [...new Set(calendar.map((day) => day.month))]

// ── Dimensions ───────────────────────────────────────────────────
const regionName = new Map(REGIONS.map((r) => [r.id, r.name]))

const outlets = OUTLETS.map(([id, name, city, regionId, type, openedOn, parking, quality]) => {
  const spec = OUTLET_TYPES[type]
  return {
    id,
    name,
    city,
    regionId,
    region: regionName.get(regionId),
    type,
    openedOn,
    parking,
    quality,
    seats: spec.seats,
    footfall: spec.footfall,
    speed: spec.speed,
    ambience: spec.ambience,
    deliveryShare: spec.delivery,
    priceIndex: CITY_PRICE_INDEX[city] ?? 1,
    // Traffic weight blends store type with city size.
    weight: spec.footfall * (regionId === 'RG01' ? 1.35 : regionId === 'RG02' || regionId === 'RG04' ? 1.05 : 0.8),
  }
})
const outletById = new Map(outlets.map((o) => [o.id, o]))
const outletPicker = outlets.map((o) => [o, o.weight])

const products = PRODUCTS.map(([id, name, category, basePrice, popularity]) => ({
  id,
  name,
  category,
  basePrice,
  popularity,
}))
// Category mix is steered to the brief's 65 / 20 / 15 split.
const CATEGORY_TARGET = { Coffee: 0.65, 'Non Coffee': 0.2, Snack: 0.15 }
const productsByCategory = {}
for (const product of products) {
  ;(productsByCategory[product.category] ??= []).push([product, product.popularity])
}

// ── 1. Media plan → daily ad performance ─────────────────────────
// Benchmarks: brand search CTR 9–14% at Rp 1.2–1.8k CPC, generic 2–4% at
// Rp 3–6k, Meta CPM Rp 15–45k, YouTube skip 60–75% / VTR 20–35%.
const googleRows = []
const metaRows = []
const youtubeRows = []
const monthlyAcquisition = new Map(months.map((m) => [m, { google: 0, meta: 0, youtube: 0, spend: 0 }]))

const keywordsByCampaign = {}
for (const [id, term, campaignId, kind, ctrPct, cpc] of KEYWORDS) {
  ;(keywordsByCampaign[campaignId] ??= []).push({ id, term, kind, ctrPct, cpc })
}

// YouTube views build brand awareness that decays over ~30 days; the stock of
// awareness lifts branded search volume later in the year.
const brandLiftByDay = new Array(TOTAL_DAYS).fill(0)

for (const campaign of CAMPAIGNS) {
  const activeDays = calendar.filter((day) => day.date >= campaign.start && day.date <= campaign.end)
  if (!activeDays.length) continue
  const daysPerMonth = {}
  for (const day of activeDays) daysPerMonth[day.month] = (daysPerMonth[day.month] ?? 0) + 1

  for (const day of activeDays) {
    const dailyBudget = campaign.monthlyBudget / daysPerMonth[day.month]
    // Pacing wobbles day to day but respects the monthly plan.
    const pacing = clamp(S.normal(1, 0.12), 0.6, 1.5) * (day.dow === 0 || day.dow === 6 ? 1.08 : 0.98)
    const spend = dailyBudget * pacing

    if (campaign.platform === 'Google Ads') {
      const keywords = keywordsByCampaign[campaign.id] ?? [{ id: 'KW00', term: campaign.name, kind: 'Generic', ctrPct: 3, cpc: 4200 }]
      for (const keyword of keywords) {
        const share = 1 / keywords.length
        const kwSpend = spend * share * clamp(S.normal(1, 0.18), 0.5, 1.7)
        const cpc = keyword.cpc * clamp(S.normal(1, 0.11), 0.7, 1.5) * (day.inRamadan ? 0.93 : 1)
        const clicks = Math.max(0, Math.round(kwSpend / cpc))
        // Branded demand rises with the awareness stock built by video.
        const lift = keyword.kind === 'Brand' ? 1 + brandLiftByDay[day.index] : 1
        const ctr = clamp(S.normal(keyword.ctrPct, keyword.ctrPct * 0.15), 0.4, 22) / 100
        const impressions = Math.max(clicks, Math.round((clicks / ctr) * lift))
        // Conversion rate: brand intent converts ~3x better than prospecting.
        const baseCvr = keyword.kind === 'Brand' ? 0.092 : keyword.kind === 'Competitor' ? 0.031 : 0.046
        const cvr = clamp(S.normal(baseCvr, baseCvr * 0.18), 0.005, 0.25)
        const conversions = S.poisson(clicks * cvr)
        const revenue = conversions * S.lognormal(Math.log(78000), 0.3)

        googleRows.push([
          day.date, campaign.id, campaign.name, campaign.objective, keyword.id, keyword.term, keyword.kind,
          S.choice(DEVICES), S.choice(AD_LOCATIONS), ageBucketForAds(), genderForAds(),
          Math.round(kwSpend), impressions, clicks, conversions, Math.round(revenue),
        ])
        const bucket = monthlyAcquisition.get(day.month)
        bucket.google += conversions
        bucket.spend += kwSpend
      }
    }

    if (campaign.platform === 'Meta Ads') {
      const cpm = (campaign.objective === 'Awareness' ? 18500 : campaign.objective === 'Retargeting' ? 41000 : 27500) * clamp(S.normal(1, 0.13), 0.6, 1.6)
      const impressions = Math.round((spend / cpm) * 1000)
      const frequency = campaign.objective === 'Retargeting' ? S.normal(3.4, 0.4) : S.normal(1.7, 0.22)
      const reach = Math.round(impressions / clamp(frequency, 1.05, 6))
      const ctr = clamp(S.normal(campaign.objective === 'Retargeting' ? 0.021 : campaign.objective === 'Conversion' ? 0.014 : 0.009, 0.0025), 0.002, 0.06)
      const clicks = Math.round(impressions * ctr)
      const engagementRate = clamp(S.normal(0.052, 0.011), 0.01, 0.14)
      const engagement = Math.round(impressions * engagementRate)
      const videoViews = campaign.objective === 'Awareness' ? Math.round(impressions * clamp(S.normal(0.31, 0.05), 0.1, 0.6)) : 0
      const cvr = campaign.objective === 'Conversion' ? 0.038 : campaign.objective === 'Retargeting' ? 0.061 : 0.011
      const conversions = S.poisson(clicks * clamp(S.normal(cvr, cvr * 0.2), 0.002, 0.2))

      metaRows.push([
        day.date, campaign.id, campaign.name, campaign.objective, S.choice(AD_LOCATIONS), ageBucketForAds(), genderForAds(),
        Math.round(spend), reach, impressions, clicks, engagement, videoViews, conversions,
      ])
      const bucket = monthlyAcquisition.get(day.month)
      bucket.meta += conversions
      bucket.spend += spend
    }

    if (campaign.platform === 'YouTube Ads') {
      const cpv = clamp(S.normal(118, 16), 60, 260)
      const views = Math.round(spend / cpv)
      const impressions = Math.round(views / clamp(S.normal(0.29, 0.04), 0.12, 0.6))
      const skipRate = clamp(S.normal(0.68, 0.05), 0.45, 0.86)
      const completionRate = clamp(S.normal(0.27, 0.05), 0.08, 0.55)
      const avgDuration = clamp(S.normal(14.8, 2.4), 4, 30)
      const watchHours = (views * avgDuration) / 3600
      const ctr = clamp(S.normal(0.0068, 0.0015), 0.001, 0.03)
      const clicks = Math.round(impressions * ctr)
      const conversions = S.poisson(clicks * clamp(S.normal(0.021, 0.005), 0.002, 0.09))

      youtubeRows.push([
        day.date, campaign.id, campaign.name, campaign.objective, S.choice(AD_LOCATIONS), ageBucketForAds(), genderForAds(),
        Math.round(spend), impressions, views, Math.round(watchHours * 10) / 10,
        Math.round(avgDuration * 10) / 10, Math.round(skipRate * 1000) / 10,
        Math.round(completionRate * 1000) / 10, clicks, conversions,
      ])

      // Awareness decays with a 30-day half-life and lifts branded search.
      for (let d = day.index; d < Math.min(TOTAL_DAYS, day.index + 45); d += 1) {
        brandLiftByDay[d] += (views / 2_600_000) * Math.exp(-(d - day.index) / 30)
      }
      const bucket = monthlyAcquisition.get(day.month)
      bucket.youtube += conversions
      bucket.spend += spend
    }
  }
}

function ageBucketForAds() {
  return S.choice([['18-24', 30], ['25-34', 38], ['35-44', 19], ['45-54', 8], ['55+', 5]])
}
function genderForAds() {
  return S.choice([['Female', 52], ['Male', 46], ['Unknown', 2]])
}

// ── 2. Acquisition curve → customer cohorts ──────────────────────
// Paid conversions seed new customers; organic and referral scale with the
// installed base, so later cohorts are bigger without any hand-tuning.
const acquisitionByMonth = []
let runningBase = 0
for (const month of months) {
  const media = monthlyAcquisition.get(month)
  const paid = media.google * 0.42 + media.meta * 0.5 + media.youtube * 0.35
  const organic = 260 + runningBase * 0.012
  const referral = runningBase * 0.008
  const total = paid + organic + referral
  acquisitionByMonth.push({ month, paid, organic, referral, total })
  runningBase += total
}
// A real customer base is not acquired entirely inside the observation window.
// 56% of the surveyed base predates it — backdated cohorts with a growth curve,
// so they are already active on day one and carry full-year behaviour.
const LEGACY_SHARE = 0.32
const LEGACY_MONTHS = 24
const legacyCohorts = []
for (let back = LEGACY_MONTHS; back >= 1; back -= 1) {
  const date = new Date(startDate.getTime() - back * 30.4 * DAY_MS)
  legacyCohorts.push({
    month: iso(date).slice(0, 7),
    signupIndex: -Math.round(back * 30.4),
    // Newer cohorts are larger: the chain kept growing before the window.
    weight: Math.exp((LEGACY_MONTHS - back) * 0.075),
  })
}
const legacyWeight = legacyCohorts.reduce((sum, c) => sum + c.weight, 0)
const legacyTarget = Math.round(TARGET_CUSTOMERS * LEGACY_SHARE)
for (const cohort of legacyCohorts) {
  cohort.customers = Math.round((cohort.weight / legacyWeight) * legacyTarget)
}

const windowTarget = TARGET_CUSTOMERS - legacyCohorts.reduce((sum, c) => sum + c.customers, 0)
const acquisitionTotal = acquisitionByMonth.reduce((sum, m) => sum + m.total, 0)
for (const entry of acquisitionByMonth) {
  entry.customers = Math.round((entry.total / acquisitionTotal) * windowTarget)
}
// Fix rounding drift so legacy + in-window lands on exactly 12,845.
let drift = windowTarget - acquisitionByMonth.reduce((sum, m) => sum + m.customers, 0)
for (let i = 0; drift !== 0; i = (i + 1) % acquisitionByMonth.length) {
  const step = drift > 0 ? 1 : -1
  acquisitionByMonth[i].customers += step
  drift -= step
}

// ── 3. Customers ─────────────────────────────────────────────────
const customers = []
let customerSeq = 0

const allCohorts = [
  ...legacyCohorts.map((c) => ({ ...c, legacy: true, paid: 0.34, organic: 0.55, referral: 0.11, total: 1 })),
  ...acquisitionByMonth.map((c) => ({ ...c, legacy: false })),
]

for (const cohort of allCohorts) {
  const monthDays = cohort.legacy ? null : calendar.filter((day) => day.month === cohort.month)
  const paidShare = cohort.paid / cohort.total

  for (let i = 0; i < cohort.customers; i += 1) {
    customerSeq += 1
    const signupDay = cohort.legacy
      ? { date: cohort.month + '-' + String(S.int(1, 28)).padStart(2, '0'), index: cohort.signupIndex + S.int(0, 29) }
      : monthDays[S.int(0, monthDays.length - 1)]

    const band = S.choice(AGE_BANDS.map((b) => [b, b.share]))
    const age = S.int(band.min, band.max)
    const gender = S.bernoulli(0.52) ? 'Female' : 'Male'
    const occupation = S.choice(OCCUPATION_BY_AGE[band.id])
    const incomeParams = INCOME_PARAMS[occupation]
    const income = roundRupiah(S.lognormal(incomeParams.mu, incomeParams.sigma), 100000)

    const homeOutlet = S.choice(outletPicker)
    const acquisition = S.bernoulli(paidShare)
      ? S.choice([['Google Ads', cohort.paid * 0.42], ['Meta Ads', cohort.paid * 0.5], ['YouTube Ads', cohort.paid * 0.35]])
      : S.bernoulli(cohort.referral / (cohort.organic + cohort.referral)) ? 'Referral' : 'Organic'

    // Latent traits. Income and age shape how often someone buys, how big the
    // basket runs, and how much a discount moves them.
    const incomeZ = clamp((Math.log(income) - 15.8) / 0.6, -2.5, 2.5)
    const priceSensitivity = clamp(S.beta(2.4, 2.4) - incomeZ * 0.12, 0.02, 0.98)
    const promoAffinity = clamp(priceSensitivity * 0.7 + S.beta(2, 3) * 0.5, 0.02, 0.98)
    const digitalAffinity = clamp(logistic(1.4 - (age - 26) * 0.06 + S.normal(0, 0.6)), 0.05, 0.97)
    const qualityExpectation = clamp(S.normal(3.9 + incomeZ * 0.16, 0.42), 2.4, 5)

    // Visits per month: over-dispersed, higher for young urban professionals.
    const baseRate = 3.2
      * (band.id === '25-35' ? 1.18 : band.id === '18-24' ? 1.02 : band.id === '36-45' ? 0.88 : 0.72)
      * (occupation === 'Professional' ? 1.12 : occupation === 'Student' ? 0.94 : occupation === 'Housewife' ? 0.8 : 1.0)
      * (homeOutlet.regionId === 'RG01' ? 1.08 : 0.95)
      * Math.exp(S.normal(0, 0.42))
    const visitRate = clamp(baseRate, 0.35, 14)

    customers.push({
      id: 'CU' + String(customerSeq).padStart(5, '0'),
      signupDate: signupDay.date,
      signupIndex: signupDay.index,
      cohort: cohort.month,
      age,
      ageBand: band.id,
      gender,
      occupation,
      income,
      homeOutlet,
      acquisition,
      priceSensitivity,
      promoAffinity,
      digitalAffinity,
      qualityExpectation,
      visitRate,
      // Running state filled in by the visit simulation.
      visits: 0,
      grossSpend: 0,
      netSpend: 0,
      discountTotal: 0,
      voucherUses: 0,
      deliveryVisits: 0,
      satisfactionSum: 0,
      waitSum: 0,
      lastVisitIndex: null,
      firstVisitIndex: null,
      channelCounts: new Map(),
      categoryCounts: new Map(),
      productCounts: new Map(),
      loyaltyPoints: 0,
      isMember: false,
      memberSince: null,
      churnedIndex: null,
    })
  }
}

// ── 4. Visit simulation ──────────────────────────────────────────
const txWriter = csvWriter('transactions.csv', [
  'TransactionID', 'CustomerID', 'OutletID', 'RegionID', 'City', 'Date', 'Time', 'Hour', 'DayPart',
  'Channel', 'PaymentMethod', 'ItemCount', 'GrossAmount', 'DiscountAmount', 'VoucherCode',
  'NetAmount', 'WaitMinutes', 'SatisfactionScore', 'IsMemberTransaction', 'PointsEarned', 'CampaignID',
])
const itemWriter = csvWriter('transaction_items.csv', [
  'TransactionItemID', 'TransactionID', 'ProductID', 'ProductName', 'Category', 'Qty', 'UnitPrice', 'LineAmount',
])

const HOUR_WEIGHTS = [
  // 0..23 — three peaks: morning commute, lunch, after-work.
  0, 0, 0, 0, 0, 0.4, 2.6, 8.4, 9.1, 5.2, 3.8, 4.6,
  8.9, 7.4, 4.1, 3.6, 4.4, 7.8, 8.6, 6.2, 3.4, 2.1, 1.1, 0.3,
]
const hourPicker = HOUR_WEIGHTS.map((weight, hour) => [hour, weight])

const dayPartOf = (hour) => (hour < 11 ? 'Pagi' : hour < 15 ? 'Siang' : hour < 19 ? 'Sore' : 'Malam')

const VOUCHERS = [
  ['NEWUSER50', 0.5, 25000],
  ['KENANGAN20', 0.2, 15000],
  ['GAJIAN15', 0.15, 12000],
  ['BUY1GET1', 0.4, 22000],
  ['RAMADANBERKAH', 0.25, 18000],
  ['MEMBERPOIN', 0.1, 8000],
]

let txSeq = 0
let itemSeq = 0
let totalTransactions = 0

for (const customer of customers) {
  let dayIndex = Math.max(0, customer.signupIndex)
  let satisfactionEma = null
  let visitNo = 0

  for (;;) {
    // Gap between visits ~ exponential around the customer's rate, modulated by
    // how busy the calendar is on the target day.
    const gapDays = Math.max(0.4, S.exponential(customer.visitRate / 30))
    dayIndex += Math.max(1, Math.round(gapDays))
    if (dayIndex >= TOTAL_DAYS) break

    const day = calendar[dayIndex]
    // Calendar pull: a slow day sometimes skips the visit entirely.
    if (!S.bernoulli(clamp(day.factor * 0.86, 0.25, 0.99))) continue

    visitNo += 1
    const outlet = S.bernoulli(0.78)
      ? customer.homeOutlet
      : S.choice(outletPicker.filter(([o]) => o.regionId === customer.homeOutlet.regionId)) ?? customer.homeOutlet

    const hour = S.choice(hourPicker)
    const minute = S.int(0, 59)
    const dayPart = dayPartOf(hour)

    // ── waiting time ──
    // Queue pressure = how far this hour is above the store's comfortable load.
    const peakPressure = HOUR_WEIGHTS[hour] / 4.2
    const load = peakPressure * day.factor * outlet.footfall / outlet.speed
    const isDelivery = S.bernoulli(clamp(outlet.deliveryShare + customer.digitalAffinity * 0.16 - 0.08, 0.05, 0.75))
    const channel = isDelivery
      ? S.choice([['GrabFood', 34], ['GoFood', 30], ['ShopeeFood', 18], ['Aplikasi Kopi Kenangan', 18 + customer.digitalAffinity * 30]])
      : S.bernoulli(0.46) ? 'Dine In' : 'Take Away'
    const waitMinutes = clamp(
      S.gamma(2.6, 1.5) * load * (isDelivery ? 1.35 : 1) / outlet.quality,
      0.8,
      42,
    )

    // ── basket ──
    const itemCount = 1 + S.poisson(0.62 + (day.dow === 0 || day.dow === 6 ? 0.14 : 0) + customer.income / 40_000_000)
    let gross = 0
    const lineItems = []
    for (let i = 0; i < itemCount; i += 1) {
      const category = S.choice(Object.entries(CATEGORY_TARGET).map(([name, share]) => [
        name,
        // Snacks skew to weekends and afternoons; coffee owns the morning.
        share * (name === 'Coffee' && hour < 11 ? 1.25 : 1) * (name === 'Snack' && (day.dow === 0 || day.dow === 6) ? 1.3 : 1),
      ]))
      const product = S.choice(productsByCategory[category])
      const qty = S.bernoulli(0.12) ? 2 : 1
      const unitPrice = roundRupiah(product.basePrice * outlet.priceIndex * clamp(S.normal(1, 0.015), 0.95, 1.06))
      const lineAmount = unitPrice * qty
      gross += lineAmount
      lineItems.push({ product, qty, unitPrice, lineAmount })
      customer.categoryCounts.set(category, (customer.categoryCounts.get(category) ?? 0) + qty)
      customer.productCounts.set(product.id, (customer.productCounts.get(product.id) ?? 0) + qty)
    }

    // ── discount and voucher ──
    // Voucher users pull a smaller net basket, exactly as the brief requires.
    const promoPush = day.inRamadan ? 1.25 : day.date >= '2025-12-15' && day.date <= '2026-01-05' ? 1.2 : 1
    const usesVoucher = S.bernoulli(clamp(customer.promoAffinity * 0.52 * promoPush + (visitNo === 1 ? 0.22 : 0), 0.02, 0.72))
    let voucherCode = ''
    let discount = 0
    if (usesVoucher) {
      const [code, rate, cap] = VOUCHERS[S.int(0, VOUCHERS.length - 1)]
      voucherCode = code
      discount = Math.min(Math.round(gross * rate), cap)
      customer.voucherUses += 1
    } else if (S.bernoulli(0.14)) {
      discount = roundRupiah(gross * clamp(S.normal(0.08, 0.03), 0.02, 0.2), 500)
    }
    const net = Math.max(5000, gross - discount)

    // ── satisfaction ──
    // Waiting time is the dominant negative term; store execution and menu
    // quality push the other way. Expectation is customer-specific.
    const waitPenalty = clamp((waitMinutes - 4.5) / 9, 0, 2.6)
    const satisfaction = clamp(
      4.45 * outlet.quality
        - waitPenalty * 0.62
        - (customer.priceSensitivity - 0.5) * 0.55 * (discount > 0 ? 0.4 : 1)
        + (outlet.ambience - 3.8) * 0.14
        + S.normal(0, 0.34),
      1,
      5,
    )
    satisfactionEma = satisfactionEma === null ? satisfaction : satisfactionEma * 0.65 + satisfaction * 0.35

    // ── membership ──
    // Probability of joining rises with visit count, as specified.
    if (!customer.isMember && S.bernoulli(clamp(0.019 * visitNo * (0.6 + customer.digitalAffinity), 0, 0.45))) {
      customer.isMember = true
      customer.memberSince = day.date
    }
    const points = customer.isMember ? Math.floor(net / 1000) : 0
    customer.loyaltyPoints += points

    // ── persist ──
    txSeq += 1
    const transactionId = 'TX' + String(txSeq).padStart(7, '0')
    const attributedCampaign = visitNo === 1 && customer.acquisition.endsWith('Ads')
      ? CAMPAIGNS.find((c) => c.platform === customer.acquisition && day.date >= c.start && day.date <= c.end)?.id ?? ''
      : ''

    txWriter.row([
      transactionId, customer.id, outlet.id, outlet.regionId, csvSafe(outlet.city), day.date,
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, hour, dayPart,
      channel, S.choice(PAYMENT_METHODS), itemCount, gross, discount, voucherCode, net,
      Math.round(waitMinutes * 10) / 10, Math.round(satisfaction * 100) / 100,
      customer.isMember ? 1 : 0, points, attributedCampaign,
    ])
    for (const line of lineItems) {
      itemSeq += 1
      itemWriter.row([
        'TI' + String(itemSeq).padStart(8, '0'), transactionId, line.product.id,
        csvSafe(line.product.name), csvSafe(line.product.category), line.qty, line.unitPrice, line.lineAmount,
      ])
    }
    totalTransactions += 1

    // ── running customer state ──
    customer.visits += 1
    customer.grossSpend += gross
    customer.netSpend += net
    customer.discountTotal += discount
    customer.satisfactionSum += satisfaction
    customer.waitSum += waitMinutes
    customer.lastVisitIndex = dayIndex
    if (customer.firstVisitIndex === null) customer.firstVisitIndex = dayIndex
    if (isDelivery) customer.deliveryVisits += 1
    customer.channelCounts.set(channel, (customer.channelCounts.get(channel) ?? 0) + 1)

    // ── churn hazard ──
    // Unhappy customers leave; members and heavy users stay. This is what makes
    // retention, repeat rate and CLV emerge from the data instead of being set.
    const churnRisk = clamp(
      0.067
        - (satisfactionEma - 3.9) * 0.075
        - (customer.isMember ? 0.028 : 0)
        - Math.min(visitNo, 12) * 0.0022,
      0.004,
      0.3,
    )
    if (S.bernoulli(churnRisk)) {
      customer.churnedIndex = dayIndex
      break
    }
  }
}

// ── 5. Survey ────────────────────────────────────────────────────
// Every customer answers once. Scores are anchored on what they actually
// experienced: their own average waiting time, the stores they used, the
// discounts they got. NPS follows satisfaction, as required.
const surveyWriter = csvWriter('survey_responses.csv', [
  'SurveyID', 'CustomerID', 'OutletID', 'ResponseDate', 'Channel', 'AgeBand', 'Gender', 'Segment',
  ...SURVEY_ATTRIBUTES.flatMap(([id]) => [`Score_${id}`, `Importance_${id}`]),
  'OverallSatisfaction', 'NPS', 'NPSGroup', 'WouldRecommend',
])

const IMPORTANCE_BASE = {
  taste: 4.72, price: 4.58, service: 4.46, ordering: 4.28, ambience: 4.19,
  variety: 3.94, promo: 3.85, location: 4.22, app: 3.78, parking: 3.52,
}

let surveySeq = 0
for (const customer of customers) {
  const visits = Math.max(customer.visits, 1)
  const avgSatisfaction = customer.visits ? customer.satisfactionSum / customer.visits : 3.6
  const avgWait = customer.visits ? customer.waitSum / customer.visits : 6
  const outlet = customer.homeOutlet
  const discountRate = customer.grossSpend ? customer.discountTotal / customer.grossSpend : 0

  const perceived = {
    taste: avgSatisfaction + (outlet.quality - 1) * 1.6 + S.normal(0, 0.3),
    price: 5 - customer.priceSensitivity * 2.2 + discountRate * 3.1 + S.normal(0, 0.34),
    service: 5 - clamp((avgWait - 4) / 4.6, 0, 2.4) + S.normal(0, 0.3),
    ordering: 3.5 + customer.digitalAffinity * 1.5 + S.normal(0, 0.28),
    ambience: outlet.ambience * 0.92 + S.normal(0, 0.32),
    variety: 3.85 + S.normal(0, 0.4),
    promo: 3.2 + discountRate * 4.4 + customer.promoAffinity * 0.5 + S.normal(0, 0.34),
    location: 4.25 + (outlet.type === 'Transit' ? 0.35 : 0) + S.normal(0, 0.3),
    app: 3.35 + customer.digitalAffinity * 1.35 + (customer.isMember ? 0.28 : 0) + S.normal(0, 0.33),
    parking: (outlet.parking ? 3.9 : 2.5) + S.normal(0, 0.4),
  }

  const scores = {}
  for (const [id] of SURVEY_ATTRIBUTES) scores[id] = clamp(Math.round(perceived[id] * 2) / 2, 1, 5)

  const overall = clamp(
    (scores.taste * 0.26 + scores.service * 0.2 + scores.price * 0.18 + scores.ambience * 0.12
      + scores.ordering * 0.1 + scores.variety * 0.07 + scores.promo * 0.07),
    1,
    5,
  )
  // NPS is driven by satisfaction with a wider spread — promoters need a 4.5+.
  const npsRaw = (overall - 1) / 4 * 10 + S.normal(0, 0.72) + (customer.isMember ? 0.5 : 0) + Math.min(visits, 15) * 0.045
  const nps = clamp(Math.round(npsRaw), 0, 10)
  const npsGroup = nps >= 9 ? 'Promoter' : nps >= 7 ? 'Passive' : 'Detractor'

  surveySeq += 1
  surveyWriter.row([
    'SV' + String(surveySeq).padStart(5, '0'), customer.id, outlet.id,
    calendar[clamp(customer.lastVisitIndex ?? TOTAL_DAYS - 1, 0, TOTAL_DAYS - 1)].date,
    dominant(customer.channelCounts, 'Dine In'), customer.ageBand, customer.gender,
    segmentOf(customer),
    ...SURVEY_ATTRIBUTES.flatMap(([id]) => [
      scores[id],
      Math.round(clamp(IMPORTANCE_BASE[id] + S.normal(0, 0.32), 1, 5) * 2) / 2,
    ]),
    Math.round(overall * 100) / 100, nps, npsGroup, nps >= 7 ? 1 : 0,
  ])
  customer.survey = { scores, overall, nps, npsGroup }
}

// ── 6. Customer master + RFM ─────────────────────────────────────
function dominant(counts, fallback) {
  let best = fallback
  let bestValue = -1
  for (const [key, value] of counts) {
    if (value > bestValue) {
      best = key
      bestValue = value
    }
  }
  return best
}

function segmentOf(customer) {
  const recencyDays = customer.lastVisitIndex === null ? 999 : TOTAL_DAYS - 1 - customer.lastVisitIndex
  const monthly = customer.visits / Math.max(1, (TOTAL_DAYS - Math.max(0, customer.signupIndex)) / 30)
  if (recencyDays > 75) return monthly > 2.4 ? 'At Risk' : 'Hibernating'
  if (monthly >= 5 && customer.netSpend > 900000) return 'Champion'
  if (monthly >= 3) return 'Loyal'
  if (customer.visits <= 2) return 'New'
  return 'Potential'
}

const customerWriter = csvWriter('customers.csv', [
  'CustomerID', 'SignupDate', 'CohortMonth', 'Age', 'AgeBand', 'Gender', 'Occupation', 'MonthlyIncome',
  'HomeOutletID', 'City', 'RegionID', 'AcquisitionChannel', 'IsMember', 'MemberSince', 'LoyaltyPoints',
  'Visits', 'GrossSpend', 'DiscountTotal', 'NetSpend', 'AvgBasket', 'VoucherUses', 'DeliveryShare',
  'FavoriteChannel', 'FavoriteCategory', 'FavoriteProductID', 'AvgWaitMinutes', 'AvgSatisfaction',
  'NPS', 'RecencyDays', 'FrequencyPerMonth', 'MonetaryTotal', 'Segment', 'Status', 'LifetimeMonths', 'CLV',
])

for (const customer of customers) {
  const windowStart = Math.max(0, customer.signupIndex)
  const tenureDays = Math.max(1, (customer.churnedIndex ?? TOTAL_DAYS - 1) - windowStart)
  const tenureMonths = tenureDays / 30
  const recencyDays = customer.lastVisitIndex === null ? TOTAL_DAYS - 1 - windowStart : TOTAL_DAYS - 1 - customer.lastVisitIndex
  const avgBasket = customer.visits ? customer.netSpend / customer.visits : 0
  const frequencyPerMonth = customer.visits / Math.max(0.5, tenureMonths)
  // CLV = basket × frequency × expected remaining life, discounted by churn.
  const monthlyChurn = clamp(0.09 - (customer.visits ? customer.satisfactionSum / customer.visits - 3.9 : 0) * 0.05 - (customer.isMember ? 0.02 : 0), 0.01, 0.4)
  const expectedLifeMonths = 1 / monthlyChurn
  const clv = avgBasket * frequencyPerMonth * expectedLifeMonths * 0.72 // 72% contribution margin

  customerWriter.row([
    customer.id, customer.signupDate, customer.cohort, customer.age, customer.ageBand, customer.gender,
    customer.occupation, customer.income, customer.homeOutlet.id, csvSafe(customer.homeOutlet.city),
    customer.homeOutlet.regionId, customer.acquisition, customer.isMember ? 1 : 0, customer.memberSince ?? '',
    customer.loyaltyPoints, customer.visits, Math.round(customer.grossSpend), Math.round(customer.discountTotal),
    Math.round(customer.netSpend), Math.round(avgBasket), customer.voucherUses,
    customer.visits ? Math.round((customer.deliveryVisits / customer.visits) * 1000) / 10 : 0,
    dominant(customer.channelCounts, 'Dine In'), dominant(customer.categoryCounts, 'Coffee'),
    dominant(customer.productCounts, 'PR01'),
    customer.visits ? Math.round((customer.waitSum / customer.visits) * 10) / 10 : 0,
    customer.visits ? Math.round((customer.satisfactionSum / customer.visits) * 100) / 100 : 0,
    customer.survey?.nps ?? '', recencyDays, Math.round(frequencyPerMonth * 100) / 100,
    Math.round(customer.netSpend), segmentOf(customer),
    customer.churnedIndex === null ? 'Active' : 'Churned',
    Math.round(((customer.churnedIndex ?? TOTAL_DAYS - 1) - customer.signupIndex) / 30 * 10) / 10, Math.round(clv),
  ])
}

// ── 7. Dimension + media exports ─────────────────────────────────
const outletWriter = csvWriter('outlets.csv', [
  'OutletID', 'OutletName', 'City', 'RegionID', 'RegionName', 'OutletType', 'OpenedOn', 'Seats', 'HasParking', 'QualityIndex', 'PriceIndex',
])
for (const outlet of outlets) {
  outletWriter.row([
    outlet.id, csvSafe(outlet.name), csvSafe(outlet.city), outlet.regionId, csvSafe(outlet.region),
    csvSafe(outlet.type), outlet.openedOn, outlet.seats, outlet.parking ? 1 : 0, outlet.quality, outlet.priceIndex,
  ])
}

const productWriter = csvWriter('products.csv', ['ProductID', 'ProductName', 'Category', 'BasePrice', 'PopularityIndex'])
for (const product of products) {
  productWriter.row([product.id, csvSafe(product.name), csvSafe(product.category), product.basePrice, product.popularity])
}

const regionWriter = csvWriter('regions.csv', ['RegionID', 'RegionName'])
for (const region of REGIONS) regionWriter.row([region.id, csvSafe(region.name)])

const campaignWriter = csvWriter('campaigns.csv', ['CampaignID', 'CampaignName', 'Platform', 'Objective', 'StartDate', 'EndDate', 'MonthlyBudget'])
for (const campaign of CAMPAIGNS) {
  campaignWriter.row([campaign.id, csvSafe(campaign.name), csvSafe(campaign.platform), campaign.objective, campaign.start, campaign.end, campaign.monthlyBudget])
}

const googleWriter = csvWriter('google_ads_performance.csv', [
  'Date', 'CampaignID', 'CampaignName', 'Objective', 'KeywordID', 'Keyword', 'MatchType',
  'Device', 'Location', 'AgeRange', 'Gender', 'Cost', 'Impressions', 'Clicks', 'Conversions', 'ConversionValue',
])
for (const row of googleRows) googleWriter.row(row.map(csvSafe))

const metaWriter = csvWriter('meta_ads_performance.csv', [
  'Date', 'CampaignID', 'CampaignName', 'Objective', 'Location', 'AgeRange', 'Gender',
  'Spend', 'Reach', 'Impressions', 'Clicks', 'Engagement', 'VideoViews', 'Conversions',
])
for (const row of metaRows) metaWriter.row(row.map(csvSafe))

const youtubeWriter = csvWriter('youtube_ads_performance.csv', [
  'Date', 'CampaignID', 'CampaignName', 'Objective', 'Location', 'AgeRange', 'Gender',
  'Spend', 'Impressions', 'Views', 'WatchTimeHours', 'AvgViewDurationSec', 'SkipRatePct', 'CompletionRatePct', 'Clicks', 'Conversions',
])
for (const row of youtubeRows) youtubeWriter.row(row.map(csvSafe))

function csvSafe(value) {
  const text = String(value)
  return text.includes(',') ? `"${text}"` : text
}

// ── Close and report ─────────────────────────────────────────────
const counts = {
  transactions: await txWriter.close(),
  transaction_items: await itemWriter.close(),
  customers: await customerWriter.close(),
  survey_responses: await surveyWriter.close(),
  outlets: await outletWriter.close(),
  products: await productWriter.close(),
  regions: await regionWriter.close(),
  campaigns: await campaignWriter.close(),
  google_ads_performance: await googleWriter.close(),
  meta_ads_performance: await metaWriter.close(),
  youtube_ads_performance: await youtubeWriter.close(),
}

console.log(`seed ${SEED} · ${TOTAL_DAYS} days · ${PERIOD_START} → ${PERIOD_END}`)
for (const [name, rows] of Object.entries(counts)) {
  console.log(`  ${name.padEnd(26)} ${rows.toLocaleString('en-US').padStart(9)} rows`)
}
