/**
 * Validates the compact Customer Journey facts emitted by build-aggregates.
 *
 * The browser relies on these facts instead of raw transaction rows, so this
 * script checks temporal ordering and additive consistency before handoff.
 */

import fs from 'node:fs'

const FILE = 'src/data/insights.json'
const cube = JSON.parse(fs.readFileSync(FILE, 'utf8'))

const CJ = {
  firstPurchaseDay: 15,
  secondPurchaseDay: 16,
  lastPurchaseDay: 17,
  totalTx: 18,
  activeMonths: 21,
}

const CJM = {
  customer: 0,
  month: 5,
  tx: 7,
  net: 8,
}

const errors = []
const assert = (condition, message) => {
  if (!condition) errors.push(message)
}

assert(Array.isArray(cube.customerJourney), 'customerJourney fact is missing')
assert(Array.isArray(cube.customerJourneyMonthly), 'customerJourneyMonthly fact is missing')
assert(cube.customerJourney.length === cube.meta.customers, `customerJourney rows (${cube.customerJourney.length}) must equal meta.customers (${cube.meta.customers})`)

const monthlyTx = new Map()
const monthlyActiveMonths = new Map()
let monthlyRevenue = 0

cube.customerJourneyMonthly.forEach((row, rowIndex) => {
  const customer = row[CJM.customer]
  assert(Number.isInteger(customer) && customer >= 0 && customer < cube.customerJourney.length, `monthly row ${rowIndex} has invalid customer index ${customer}`)
  assert(Number.isInteger(row[CJM.month]) && row[CJM.month] >= 0 && row[CJM.month] < cube.dims.months.length, `monthly row ${rowIndex} has invalid month index ${row[CJM.month]}`)
  assert(row[CJM.tx] > 0, `monthly row ${rowIndex} must have positive tx`)
  assert(row[CJM.net] >= 0, `monthly row ${rowIndex} must have non-negative net`)
  monthlyTx.set(customer, (monthlyTx.get(customer) ?? 0) + row[CJM.tx])
  monthlyRevenue += row[CJM.net]
  const months = monthlyActiveMonths.get(customer) ?? new Set()
  months.add(row[CJM.month])
  monthlyActiveMonths.set(customer, months)
})

let lifecycleTx = 0
let customersWithPurchase = 0
cube.customerJourney.forEach((row, index) => {
  const first = row[CJ.firstPurchaseDay]
  const second = row[CJ.secondPurchaseDay]
  const last = row[CJ.lastPurchaseDay]
  const totalTx = row[CJ.totalTx]
  lifecycleTx += totalTx
  if (totalTx > 0) {
    customersWithPurchase += 1
    assert(first >= 0, `customer ${index} has tx but no first purchase day`)
    assert(last >= first, `customer ${index} last purchase is before first purchase`)
  } else {
    assert(first === -1 && second === -1 && last === -1, `customer ${index} has no tx but purchase dates are populated`)
  }
  if (totalTx >= 2) {
    assert(second >= first, `customer ${index} second purchase is before first purchase`)
    assert(last >= second, `customer ${index} last purchase is before second purchase`)
  } else {
    assert(second === -1, `customer ${index} has fewer than two tx but second purchase is populated`)
  }
  assert((monthlyTx.get(index) ?? 0) === totalTx, `customer ${index} totalTx (${totalTx}) does not match monthly sum (${monthlyTx.get(index) ?? 0})`)
  assert((monthlyActiveMonths.get(index)?.size ?? 0) === row[CJ.activeMonths], `customer ${index} activeMonths does not match monthly fact`)
})

const aggregateTx = cube.monthly.reduce((sum, row) => sum + row[1], 0)
const aggregateRevenue = cube.monthly.reduce((sum, row) => sum + row[2], 0)
assert(lifecycleTx === aggregateTx, `customer journey tx (${lifecycleTx}) must equal monthly aggregate tx (${aggregateTx})`)
assert(Math.abs(monthlyRevenue - aggregateRevenue) <= cube.customerJourneyMonthly.length, `customer journey revenue (${monthlyRevenue}) must align with monthly aggregate revenue (${aggregateRevenue})`)
assert(customersWithPurchase > 0, 'customerJourney must contain customers with purchase history')

if (errors.length) {
  console.error('\nCustomer Journey validation failed:')
  errors.slice(0, 30).forEach((error) => console.error('  - ' + error))
  if (errors.length > 30) console.error(`  ... ${errors.length - 30} more errors`)
  process.exit(1)
}

console.log('Customer Journey validation passed')
console.log(`  customers              ${cube.customerJourney.length.toLocaleString('en-US')}`)
console.log(`  customer-month rows    ${cube.customerJourneyMonthly.length.toLocaleString('en-US')}`)
console.log(`  customers with purchase ${customersWithPurchase.toLocaleString('en-US')}`)
console.log(`  lifecycle tx           ${lifecycleTx.toLocaleString('en-US')}`)
