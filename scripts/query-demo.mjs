/**
 * Proves the cube behaves like a warehouse: pick any slice, every KPI
 * re-aggregates from the same rows. This file is also the reference for the
 * selector the dashboard will use.
 *
 *   node scripts/query-demo.mjs
 */

import fs from 'node:fs'

const cube = JSON.parse(fs.readFileSync('src/data/insights.json', 'utf8'))
const { dims } = cube

// fact columns
const F = { month: 0, outlet: 1, gender: 2, age: 3, tx: 4, net: 5, gross: 6, disc: 7, items: 8, wait: 9, sat: 10, member: 11, voucher: 12 }
// customer columns
const C = { outlet: 0, gender: 1, age: 2, segment: 3, visits: 4, net: 5, nps: 6, sat: 7, member: 8, active: 9, clv: 10, freq: 11, recency: 12, acq: 13 }
// survey columns
const V = { outlet: 0, gender: 1, age: 2, n: 3, sat: 4, nps: 5, promoters: 6, detractors: 7 }
// activity columns
const A = { month: 0, outlet: 1, gender: 2, age: 3, active: 4, repeat: 5 }

const monthQuarter = dims.months.map((m) => {
  const [year, month] = m.split('-').map(Number)
  return `${year}-Q${Math.ceil(month / 3)}`
})

function resolve(filter) {
  const outletIds = new Set(
    dims.outlets
      .map((o, i) => [o, i])
      .filter(([o]) =>
        (!filter.outlet || o.id === filter.outlet) &&
        (!filter.city || o.city === filter.city) &&
        (!filter.region || o.region === filter.region))
      .map(([, i]) => i),
  )
  const monthIds = new Set(
    dims.months
      .map((m, i) => i)
      .filter((i) =>
        (!filter.month || dims.months[i] === filter.month) &&
        (!filter.quarter || monthQuarter[i] === filter.quarter)),
  )
  const genderIds = new Set(filter.gender ? [dims.genders.indexOf(filter.gender)] : dims.genders.map((_, i) => i))
  const ageIds = new Set(filter.age ? [dims.ageBands.indexOf(filter.age)] : dims.ageBands.map((_, i) => i))
  return { outletIds, monthIds, genderIds, ageIds }
}

export function query(filter = {}) {
  const { outletIds, monthIds, genderIds, ageIds } = resolve(filter)

  let tx = 0, net = 0, gross = 0, disc = 0, items = 0, wait = 0, sat = 0, member = 0, voucher = 0
  for (const row of cube.facts) {
    if (!monthIds.has(row[F.month]) || !outletIds.has(row[F.outlet])) continue
    if (!genderIds.has(row[F.gender]) || !ageIds.has(row[F.age])) continue
    tx += row[F.tx]; net += row[F.net]; gross += row[F.gross]; disc += row[F.disc]
    items += row[F.items]; wait += row[F.wait]; sat += row[F.sat]
    member += row[F.member]; voucher += row[F.voucher]
  }

  // Distinct-count measures are recomputed over the filtered population;
  // they cannot be summed out of the additive cube.
  let people = 0, repeat = 0, active = 0, clv = 0, freq = 0, members = 0, spend = 0
  for (const row of cube.customers) {
    if (!outletIds.has(row[C.outlet])) continue
    if (!genderIds.has(row[C.gender]) || !ageIds.has(row[C.age])) continue
    people += 1
    if (row[C.visits] >= 2) repeat += 1
    active += row[C.active]
    clv += row[C.clv]
    freq += row[C.freq] / 100
    members += row[C.member]
    spend += row[C.net]
  }

  let sn = 0, ssat = 0, promoters = 0, detractors = 0
  for (const row of cube.survey) {
    if (!outletIds.has(row[V.outlet])) continue
    if (!genderIds.has(row[V.gender]) || !ageIds.has(row[V.age])) continue
    sn += row[V.n]; ssat += row[V.sat] / 100
    promoters += row[V.promoters]; detractors += row[V.detractors]
  }

  // Period-scoped activity: active base and repeat rate for the slice itself,
  // which is what makes month/quarter filters move the customer KPIs.
  let periodActive = 0, periodRepeat = 0
  for (const row of cube.activity) {
    if (!monthIds.has(row[A.month]) || !outletIds.has(row[A.outlet])) continue
    if (!genderIds.has(row[A.gender]) || !ageIds.has(row[A.age])) continue
    periodActive += row[A.active]
    periodRepeat += row[A.repeat]
  }

  const monthsInSlice = [...monthIds].length || 1

  return {
    transactions: tx,
    customers: people,
    revenue: net,
    monthlyRevenue: net / monthsInSlice,
    avgBasket: tx ? net / tx : 0,
    itemsPerBasket: tx ? items / tx : 0,
    discountRate: gross ? disc / gross : 0,
    voucherRate: tx ? voucher / tx : 0,
    memberShare: tx ? member / tx : 0,
    avgWait: tx ? wait / tx : 0,
    satisfaction: tx ? sat / tx : 0,
    experienceScore: tx ? sat / tx : 0,
    surveySatisfaction: sn ? ssat / sn : 0,
    nps: sn ? Math.round(((promoters - detractors) / sn) * 100) : 0,
    repeatRate: periodActive ? periodRepeat / periodActive : 0,
    lifetimeRepeatRate: people ? repeat / people : 0,
    activeCustomers: Math.round(periodActive / monthsInSlice),
    retentionRate: people ? active / people : 0,
    churnRate: people ? 1 - active / people : 0,
    avgFrequency: periodActive ? tx / (periodActive / monthsInSlice) / monthsInSlice : 0,
    clv: people ? clv / people : 0,
    membershipRate: people ? members / people : 0,
  }
}

// ── demo ─────────────────────────────────────────────────────────
const rp = (v) => 'Rp ' + Math.round(v).toLocaleString('id-ID')
const pc = (v) => (v * 100).toFixed(1) + '%'

const scenarios = [
  ['Semua data', {}],
  ['Kuartal 2 2026', { quarter: '2026-Q2' }],
  ['Kuartal 1 2026 (Ramadan)', { quarter: '2026-Q1' }],
  ['Wilayah Jabodetabek', { region: 'Jabodetabek' }],
  ['Wilayah Bali & Nusa Tenggara', { region: 'Bali & Nusa Tenggara' }],
  ['Outlet Senopati (kualitas tinggi)', { outlet: 'OT06' }],
  ['Outlet Cakung Raya (kualitas rendah)', { outlet: 'OT18' }],
  ['Perempuan 25-35', { gender: 'Female', age: '25-35' }],
  ['Laki-laki 46+', { gender: 'Male', age: '46+' }],
  ['Jakarta Selatan, Q2 2026', { city: 'Jakarta Selatan', quarter: '2026-Q2' }],
]

const cols = ['Trx', 'Basket', 'Sat', 'NPS', 'Repeat', 'Freq', 'Wait', 'CLV']
console.log('\n' + 'Slice'.padEnd(34) + cols.map((c) => c.padStart(11)).join(''))
console.log('─'.repeat(34 + cols.length * 11))
for (const [label, filter] of scenarios) {
  const k = query(filter)
  console.log(
    label.padEnd(34) +
    k.transactions.toLocaleString('en-US').padStart(11) +
    rp(k.avgBasket).padStart(11) +
    k.surveySatisfaction.toFixed(2).padStart(11) +
    String(k.nps).padStart(11) +
    pc(k.repeatRate).padStart(11) +
    (k.avgFrequency.toFixed(2) + 'x').padStart(11) +
    (k.avgWait.toFixed(1) + 'm').padStart(11) +
    rp(k.clv).padStart(11),
  )
}

console.log('\nSanity checks')
console.log('─'.repeat(64))
const all = query({})
const q2 = query({ quarter: '2026-Q2' })
const q1 = query({ quarter: '2026-Q1' })
const good = query({ outlet: 'OT06' })
const weak = query({ outlet: 'OT18' })
const check = (label, pass, detail) => console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label.padEnd(46)} ${detail}`)

check('Q2 revenue per month > Q1 (post-Ramadan recovery)', q2.monthlyRevenue > q1.monthlyRevenue,
  rp(q2.monthlyRevenue) + ' vs ' + rp(q1.monthlyRevenue))
check('High-quality outlet has shorter waits', good.avgWait < weak.avgWait,
  good.avgWait.toFixed(1) + 'm vs ' + weak.avgWait.toFixed(1) + 'm')
check('…and therefore higher satisfaction', good.surveySatisfaction > weak.surveySatisfaction,
  good.surveySatisfaction.toFixed(2) + ' vs ' + weak.surveySatisfaction.toFixed(2))
check('…and therefore higher NPS', good.nps > weak.nps, good.nps + ' vs ' + weak.nps)
check('…and therefore higher retention', good.retentionRate > weak.retentionRate,
  pc(good.retentionRate) + ' vs ' + pc(weak.retentionRate))
check('…and therefore higher CLV', good.clv > weak.clv, rp(good.clv) + ' vs ' + rp(weak.clv))
check('Slices sum back to the total', Math.abs(
  ['Female', 'Male'].reduce((s, g) => s + query({ gender: g }).transactions, 0) - all.transactions) < 1,
  all.transactions.toLocaleString('en-US'))
check('Age bands sum back to the total', Math.abs(
  dims.ageBands.reduce((s, a) => s + query({ age: a }).transactions, 0) - all.transactions) < 1,
  all.transactions.toLocaleString('en-US'))
console.log()
