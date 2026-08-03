/**
 * Reads the generated export back and checks that the relationships the brief
 * asked for actually hold in the data — not in the code that wrote it.
 *
 *   node scripts/validate-dataset.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const DIR = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'data'

async function readCsv(file, onRow) {
  const stream = fs.createReadStream(path.join(DIR, file), { encoding: 'utf8' })
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity })
  let header = null
  for await (const line of lines) {
    if (!line) continue
    if (!header) {
      header = splitCsv(line)
      continue
    }
    const values = splitCsv(line)
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

const pct = (value) => (value * 100).toFixed(1) + '%'
const rp = (value) => 'Rp ' + Math.round(value).toLocaleString('id-ID')

function pearson(pairs) {
  const n = pairs.length
  if (n < 2) return 0
  let sx = 0, sy = 0
  for (const [x, y] of pairs) { sx += x; sy += y }
  const mx = sx / n, my = sy / n
  let num = 0, dx = 0, dy = 0
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my)
    dx += (x - mx) ** 2
    dy += (y - my) ** 2
  }
  return num / Math.sqrt(dx * dy || 1)
}

// ── load ─────────────────────────────────────────────────────────
const outlets = new Map()
await readCsv('outlets.csv', (r) => outlets.set(r.OutletID, r))

const customers = new Map()
await readCsv('customers.csv', (r) => customers.set(r.CustomerID, r))

const stats = {
  tx: 0, gross: 0, net: 0, discount: 0,
  weekend: 0, weekday: 0, weekendDays: new Set(), weekdayDays: new Set(),
  hours: new Array(24).fill(0),
  voucher: { n: 0, net: 0 }, noVoucher: { n: 0, net: 0 },
  waitByHour: new Map(),
  waitSatPairs: [],
  months: new Map(),
  byOutlet: new Map(),
  categories: new Map(),
  channels: new Map(),
  payments: new Map(),
}

await readCsv('transactions.csv', (r) => {
  const net = +r.NetAmount
  const gross = +r.GrossAmount
  stats.tx += 1
  stats.gross += gross
  stats.net += net
  stats.discount += +r.DiscountAmount
  stats.hours[+r.Hour] += 1

  const dow = new Date(r.Date + 'T00:00:00Z').getUTCDay()
  if (dow === 0 || dow === 6) { stats.weekend += 1; stats.weekendDays.add(r.Date) }
  else { stats.weekday += 1; stats.weekdayDays.add(r.Date) }

  if (r.VoucherCode) { stats.voucher.n += 1; stats.voucher.net += net }
  else { stats.noVoucher.n += 1; stats.noVoucher.net += net }

  const hourBucket = stats.waitByHour.get(+r.Hour) ?? { sum: 0, n: 0 }
  hourBucket.sum += +r.WaitMinutes
  hourBucket.n += 1
  stats.waitByHour.set(+r.Hour, hourBucket)

  if (stats.waitSatPairs.length < 60000) stats.waitSatPairs.push([+r.WaitMinutes, +r.SatisfactionScore])

  const month = r.Date.slice(0, 7)
  const m = stats.months.get(month) ?? { tx: 0, net: 0 }
  m.tx += 1; m.net += net
  stats.months.set(month, m)

  const o = stats.byOutlet.get(r.OutletID) ?? { tx: 0, net: 0, wait: 0, sat: 0 }
  o.tx += 1; o.net += net; o.wait += +r.WaitMinutes; o.sat += +r.SatisfactionScore
  stats.byOutlet.set(r.OutletID, o)

  stats.channels.set(r.Channel, (stats.channels.get(r.Channel) ?? 0) + 1)
  stats.payments.set(r.PaymentMethod, (stats.payments.get(r.PaymentMethod) ?? 0) + 1)
})

await readCsv('transaction_items.csv', (r) => {
  const c = stats.categories.get(r.Category) ?? { qty: 0, amount: 0 }
  c.qty += +r.Qty
  c.amount += +r.LineAmount
  stats.categories.set(r.Category, c)
})

const survey = { n: 0, promoters: 0, detractors: 0, satSum: 0, npsSum: 0, byAttr: new Map(), satNpsPairs: [] }
await readCsv('survey_responses.csv', (r) => {
  survey.n += 1
  survey.satSum += +r.OverallSatisfaction
  survey.npsSum += +r.NPS
  if (r.NPSGroup === 'Promoter') survey.promoters += 1
  if (r.NPSGroup === 'Detractor') survey.detractors += 1
  survey.satNpsPairs.push([+r.OverallSatisfaction, +r.NPS])
  for (const key of Object.keys(r)) {
    if (!key.startsWith('Score_')) continue
    const attr = key.slice(6)
    const bucket = survey.byAttr.get(attr) ?? { perf: 0, imp: 0, n: 0 }
    bucket.perf += +r[key]
    bucket.imp += +r['Importance_' + attr]
    bucket.n += 1
    survey.byAttr.set(attr, bucket)
  }
})

// ── report ───────────────────────────────────────────────────────
const line = (label, value) => console.log('  ' + label.padEnd(38) + value)
const head = (title) => console.log('\n' + title + '\n' + '─'.repeat(64))

head('VOLUME')
line('Transactions', stats.tx.toLocaleString('en-US'))
line('Customers', customers.size.toLocaleString('en-US'))
line('Survey responses', survey.n.toLocaleString('en-US'))
line('Gross revenue', rp(stats.gross))
line('Net revenue', rp(stats.net))
line('Discount rate', pct(stats.discount / stats.gross))

head('MIX (target: Coffee 65 / Non Coffee 20 / Snack 15)')
const totalQty = [...stats.categories.values()].reduce((s, c) => s + c.qty, 0)
for (const [name, c] of [...stats.categories].sort((a, b) => b[1].qty - a[1].qty)) {
  line(name, pct(c.qty / totalQty) + '  ' + rp(c.amount))
}

head('SEASONALITY')
const weekendAvg = stats.weekend / stats.weekendDays.size
const weekdayAvg = stats.weekday / stats.weekdayDays.size
line('Avg transactions per weekend day', Math.round(weekendAvg).toLocaleString('en-US'))
line('Avg transactions per weekday', Math.round(weekdayAvg).toLocaleString('en-US'))
line('Weekend uplift', '+' + pct(weekendAvg / weekdayAvg - 1))
const peakHours = stats.hours.map((n, h) => [h, n]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([h]) => h).sort((a, b) => a - b)
line('Busiest hours', peakHours.map((h) => String(h).padStart(2, '0') + ':00').join(' '))

head('CAUSAL CHAINS')
line('corr(wait, satisfaction)', pearson(stats.waitSatPairs).toFixed(3) + '   (expect strong negative)')
const waitPeak = [7, 8, 12, 17, 18].reduce((s, h) => s + stats.waitByHour.get(h).sum / stats.waitByHour.get(h).n, 0) / 5
const waitOff = [10, 14, 15, 21].reduce((s, h) => s + stats.waitByHour.get(h).sum / stats.waitByHour.get(h).n, 0) / 4
line('Avg wait at peak hours', waitPeak.toFixed(1) + ' min')
line('Avg wait off-peak', waitOff.toFixed(1) + ' min')
line('corr(satisfaction, NPS)', pearson(survey.satNpsPairs).toFixed(3) + '   (expect strong positive)')

const voucherBasket = stats.voucher.net / stats.voucher.n
const plainBasket = stats.noVoucher.net / stats.noVoucher.n
line('Basket with voucher', rp(voucherBasket))
line('Basket without voucher', rp(plainBasket))
line('Voucher basket delta', pct(voucherBasket / plainBasket - 1) + '   (expect negative)')

// frequency → membership, satisfaction → repeat, repeat → CLV
const buckets = [[], [], [], [], []]
const satRepeat = []
const repeatClv = []
for (const c of customers.values()) {
  const freq = +c.FrequencyPerMonth
  const idx = freq < 1 ? 0 : freq < 2.5 ? 1 : freq < 4 ? 2 : freq < 6 ? 3 : 4
  buckets[idx].push(+c.IsMember)
  if (+c.Visits > 0) {
    satRepeat.push([+c.AvgSatisfaction, +c.Visits])
    repeatClv.push([+c.Visits, +c.CLV])
  }
}
const labels = ['<1/mo', '1–2.5/mo', '2.5–4/mo', '4–6/mo', '6+/mo']
buckets.forEach((b, i) => {
  if (b.length) line('Membership rate ' + labels[i], pct(b.reduce((s, v) => s + v, 0) / b.length) + `  (n=${b.length})`)
})
line('corr(satisfaction, visits)', pearson(satRepeat).toFixed(3) + '   (expect positive)')
line('corr(visits, CLV)', pearson(repeatClv).toFixed(3) + '   (expect positive)')

head('KPI — COMPUTED FROM THE DATA')
const activeCustomers = [...customers.values()].filter((c) => c.Status === 'Active').length
const repeatCustomers = [...customers.values()].filter((c) => +c.Visits >= 2).length
const avgSat = survey.satSum / survey.n
const nps = ((survey.promoters - survey.detractors) / survey.n) * 100
const totalVisits = [...customers.values()].reduce((s, c) => s + +c.Visits, 0)
const avgFreq = [...customers.values()].reduce((s, c) => s + +c.FrequencyPerMonth, 0) / customers.size
const clvAvg = [...customers.values()].reduce((s, c) => s + +c.CLV, 0) / customers.size
line('Customer Satisfaction', (avgSat / 5 * 100).toFixed(1) + '%  (' + avgSat.toFixed(2) + '/5)')
line('Repeat Purchase Rate', pct(repeatCustomers / customers.size))
line('Avg Purchase Frequency', avgFreq.toFixed(2) + 'x / month')
line('Average Basket', rp(stats.net / stats.tx))
line('NPS', Math.round(nps) + '  (P ' + pct(survey.promoters / survey.n) + ' · D ' + pct(survey.detractors / survey.n) + ')')
line('Monthly Revenue (avg)', rp(stats.net / stats.months.size))
line('Retention Rate', pct(activeCustomers / customers.size))
line('Churn Rate', pct(1 - activeCustomers / customers.size))
line('Customer Lifetime Value', rp(clvAvg))
line('Visits per customer', (totalVisits / customers.size).toFixed(1))

head('NEEDS — IMPORTANCE vs PERFORMANCE')
const needs = [...survey.byAttr].map(([attr, b]) => ({
  attr, imp: b.imp / b.n, perf: b.perf / b.n, gap: b.perf / b.n - b.imp / b.n,
})).sort((a, b) => a.gap - b.gap)
for (const n of needs) {
  line(n.attr, `imp ${n.imp.toFixed(2)}  perf ${n.perf.toFixed(2)}  gap ${n.gap.toFixed(2)}`)
}

head('MEDIA')
for (const [file, label] of [['google_ads_performance.csv', 'Google Ads'], ['meta_ads_performance.csv', 'Meta Ads'], ['youtube_ads_performance.csv', 'YouTube Ads']]) {
  const agg = { spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0, views: 0 }
  await readCsv(file, (r) => {
    agg.spend += +(r.Cost ?? r.Spend ?? 0)
    agg.impressions += +(r.Impressions ?? 0)
    agg.clicks += +(r.Clicks ?? 0)
    agg.conversions += +(r.Conversions ?? 0)
    agg.value += +(r.ConversionValue ?? 0)
    agg.views += +(r.Views ?? r.VideoViews ?? 0)
  })
  console.log('  ' + label)
  line('   Spend', rp(agg.spend))
  line('   Impressions', agg.impressions.toLocaleString('en-US'))
  line('   CTR', pct(agg.clicks / agg.impressions))
  if (agg.clicks) line('   CPC', rp(agg.spend / agg.clicks))
  line('   CPM', rp((agg.spend / agg.impressions) * 1000))
  if (agg.conversions) line('   CPA', rp(agg.spend / agg.conversions))
  if (agg.value) line('   ROAS', (agg.value / agg.spend).toFixed(2) + 'x')
  if (agg.views) line('   Views', agg.views.toLocaleString('en-US'))
}

head('OUTLET SPREAD (filters must move the numbers)')
const outletRows = [...stats.byOutlet].map(([id, o]) => ({
  name: outlets.get(id).OutletName, tx: o.tx, basket: o.net / o.tx, wait: o.wait / o.tx, sat: o.sat / o.tx,
})).sort((a, b) => b.sat - a.sat)
for (const o of [outletRows[0], outletRows[1], outletRows[outletRows.length - 2], outletRows[outletRows.length - 1]]) {
  line(o.name, `${o.tx.toLocaleString('en-US')} tx · ${rp(o.basket)} · ${o.wait.toFixed(1)} min · sat ${o.sat.toFixed(2)}`)
}
console.log()
