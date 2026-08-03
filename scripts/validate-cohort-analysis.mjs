import fs from 'node:fs'
import path from 'node:path'

const FILE = path.join('public', 'assets', 'cohortAnalysis.json')
const payload = JSON.parse(fs.readFileSync(FILE, 'utf8'))

const C = {
  customer: 0,
  outlet: 1,
  gender: 2,
  age: 3,
  segment: 4,
  member: 5,
  acquisition: 6,
  firstMonth: 7,
  acquisitionMonth: 8,
  membershipMonth: 9,
  firstCampaignMonth: 10,
  firstPurchaseDay: 11,
  secondPurchaseDay: 12,
  lastPurchaseDay: 13,
  totalTx: 14,
  netSpend: 15,
  clv: 16,
  firstChannel: 17,
  voucherAtEntry: 18,
  campaignAtEntry: 19,
  firstMonthTx: 20,
  firstMonthRevenue: 21,
  lastActiveMonth: 22,
}

const A = { customer: 0, month: 1, outlet: 2, channel: 3, tx: 4, net: 5, voucherTx: 6, memberTx: 7, campaignTx: 8, satSum: 9 }

const errors = []
const assert = (condition, message) => {
  if (!condition) errors.push(message)
}
const finite = (value) => Number.isFinite(value)
const safeDivide = (value, total) => (total ? value / total : null)

assert(Array.isArray(payload.customers), 'customers array missing')
assert(Array.isArray(payload.activities), 'activities array missing')
assert(payload.meta.analysisCutoffMonth >= 0, 'analysis cutoff month invalid')

const customers = new Map()
const firstCohortSeen = new Map()
for (const [index, row] of payload.customers.entries()) {
  assert(row.length === 23, `customer row ${index} must have 23 columns`)
  assert(!customers.has(row[C.customer]), `duplicate customer row ${row[C.customer]}`)
  customers.set(row[C.customer], row)
  assert(row[C.firstMonth] >= 0, `customer ${row[C.customer]} first purchase month invalid`)
  assert(row[C.firstMonth] <= payload.meta.analysisCutoffMonth, `customer ${row[C.customer]} first purchase after cutoff`)
  assert(row[C.firstPurchaseDay] <= payload.meta.analysisCutoffDay, `customer ${row[C.customer]} first purchase day after cutoff`)
  assert(row[C.totalTx] >= 1, `customer ${row[C.customer]} has no valid transaction`)
  assert(row[C.firstMonthTx] >= 1, `customer ${row[C.customer]} has no Month 0 transaction`)
  assert(row[C.firstMonthRevenue] >= 0, `customer ${row[C.customer]} has negative entry revenue`)
  assert(row[C.secondPurchaseDay] < 0 || row[C.secondPurchaseDay] >= row[C.firstPurchaseDay], `customer ${row[C.customer]} second purchase before first`)
  assert(row[C.lastPurchaseDay] >= row[C.firstPurchaseDay], `customer ${row[C.customer]} last purchase before first`)
  assert(row[C.lastActiveMonth] >= row[C.firstMonth], `customer ${row[C.customer]} last active month before first month`)
  firstCohortSeen.set(row[C.customer], row[C.firstMonth])
}

const activityKeys = new Set()
for (const [index, row] of payload.activities.entries()) {
  assert(row.length === 10, `activity row ${index} must have 10 columns`)
  const customer = customers.get(row[A.customer])
  assert(Boolean(customer), `activity row ${index} references unknown customer`)
  if (!customer) continue
  const key = `${row[A.customer]}|${row[A.month]}|${row[A.channel]}`
  assert(!activityKeys.has(key), `duplicate customer-month-channel activity ${key}`)
  activityKeys.add(key)
  assert(row[A.month] >= customer[C.firstMonth], `activity row ${index} occurs before first purchase cohort`)
  for (const column of [A.tx, A.net, A.voucherTx, A.memberTx, A.campaignTx, A.satSum]) {
    assert(finite(row[column]), `activity row ${index} column ${column} not finite`)
    assert(row[column] >= 0, `activity row ${index} column ${column} negative`)
  }
}

const cohortSizes = new Map()
const activeByCohortAge = new Map()
const revenueByCohortAge = new Map()
const entryRevenue = new Map()

for (const row of payload.customers) {
  const cohort = row[C.firstMonth]
  cohortSizes.set(cohort, (cohortSizes.get(cohort) ?? 0) + 1)
  entryRevenue.set(cohort, (entryRevenue.get(cohort) ?? 0) + row[C.firstMonthRevenue])
}

const activeSets = new Map()
for (const row of payload.activities) {
  const customer = customers.get(row[A.customer])
  const cohort = customer[C.firstMonth]
  const age = row[A.month] - cohort
  const key = `${cohort}|${age}`
  const set = activeSets.get(key) ?? new Set()
  set.add(row[A.customer])
  activeSets.set(key, set)
  revenueByCohortAge.set(key, (revenueByCohortAge.get(key) ?? 0) + row[A.net])
}
for (const [key, set] of activeSets.entries()) activeByCohortAge.set(key, set.size)

for (const [cohort, size] of cohortSizes.entries()) {
  const m0 = activeByCohortAge.get(`${cohort}|0`) ?? 0
  assert(m0 === size, `Month 0 active ${m0} differs from cohort size ${size} for cohort ${cohort}`)
  const maxAge = payload.meta.analysisCutoffMonth - cohort
  let cumulative = 0
  for (let age = 0; age <= maxAge; age += 1) {
    const key = `${cohort}|${age}`
    const active = activeByCohortAge.get(key) ?? 0
    assert(active <= size, `active customers exceed cohort size at ${key}`)
    const retention = safeDivide(active, size)
    assert(retention === null || (retention >= 0 && retention <= 1), `retention outside range at ${key}`)
    const revenue = revenueByCohortAge.get(key) ?? 0
    assert(finite(revenue), `revenue not finite at ${key}`)
    cumulative += revenue
    assert(finite(cumulative), `cumulative revenue not finite at ${key}`)
  }
}

function weightedRetention(age) {
  let active = 0
  let denominator = 0
  for (const [cohort, size] of cohortSizes.entries()) {
    if (payload.meta.analysisCutoffMonth - cohort < age) continue
    active += activeByCohortAge.get(`${cohort}|${age}`) ?? 0
    denominator += size
  }
  return { active, denominator, retention: safeDivide(active, denominator) }
}

const m1 = weightedRetention(1)
const m3 = weightedRetention(3)
const m6 = weightedRetention(6)
for (const [label, row] of Object.entries({ m1, m3, m6 })) {
  assert(row.retention === null || (row.retention >= 0 && row.retention <= 1), `${label} weighted retention outside range`)
  assert(row.active <= row.denominator, `${label} weighted active exceeds denominator`)
}

if (errors.length) {
  console.error(`Cohort validation failed with ${errors.length} issue(s):`)
  for (const error of errors.slice(0, 60)) console.error(`- ${error}`)
  if (errors.length > 60) console.error(`... ${errors.length - 60} more`)
  process.exit(1)
}

console.log('Cohort Analysis validation passed')
console.log(`  customers: ${payload.customers.length.toLocaleString('id-ID')}`)
console.log(`  activities: ${payload.activities.length.toLocaleString('id-ID')}`)
console.log(`  cohorts: ${cohortSizes.size.toLocaleString('id-ID')}`)
console.log(`  weighted M1 retention: ${m1.retention === null ? 'N/A' : (m1.retention * 100).toFixed(2) + '%'}`)
console.log(`  weighted M3 retention: ${m3.retention === null ? 'N/A' : (m3.retention * 100).toFixed(2) + '%'}`)
console.log(`  weighted M6 retention: ${m6.retention === null ? 'N/A' : (m6.retention * 100).toFixed(2) + '%'}`)
