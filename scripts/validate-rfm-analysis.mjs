import fs from 'node:fs'
import path from 'node:path'

const file = path.join('public', 'assets', 'rfmAnalysis.json')
const payload = JSON.parse(fs.readFileSync(file, 'utf8'))

function assert(condition, message) {
  if (!condition) {
    console.error(`RFM validation failed: ${message}`)
    process.exit(1)
  }
}

const CM = { customer: 0, month: 1, outlet: 2, channel: 3, tx: 4, net: 5, voucher: 8, campaign: 9, sat: 11, wait: 12, items: 13, first: 14, last: 15 }

assert(payload.meta && payload.dims && Array.isArray(payload.customers), 'missing top-level shape')
assert(Array.isArray(payload.customerMonthly) && payload.customerMonthly.length > 0, 'missing customerMonthly facts')
assert(payload.dims.customerIds.length === payload.customers.length, 'customerIds and customer rows mismatch')

const monthlyKeys = new Set()
let txTotal = 0
let netTotal = 0
let maxLast = 0
for (const [index, row] of payload.customerMonthly.entries()) {
  assert(row.length === 16, `customerMonthly row ${index} has invalid width`)
  assert(row[CM.customer] >= 0 && row[CM.customer] < payload.customers.length, `row ${index} invalid customer index`)
  assert(row[CM.month] >= 0 && row[CM.month] < payload.dims.months.length, `row ${index} invalid month`)
  assert(row[CM.outlet] >= 0 && row[CM.outlet] < payload.dims.outlets.length, `row ${index} invalid outlet`)
  assert(row[CM.channel] >= 0 && row[CM.channel] < payload.dims.channels.length, `row ${index} invalid channel`)
  assert(row[CM.tx] >= 1, `row ${index} has no transaction`)
  assert(Number.isFinite(row[CM.net]) && row[CM.net] >= 0, `row ${index} invalid net`)
  assert(row[CM.voucher] >= 0 && row[CM.voucher] <= row[CM.tx], `row ${index} invalid voucher count`)
  assert(row[CM.campaign] >= 0 && row[CM.campaign] <= row[CM.tx], `row ${index} invalid campaign count`)
  assert(row[CM.first] <= row[CM.last], `row ${index} first date after last date`)
  const key = row.slice(0, 4).join('|')
  assert(!monthlyKeys.has(key), `duplicate customer-month-outlet-channel ${key}`)
  monthlyKeys.add(key)
  txTotal += row[CM.tx]
  netTotal += row[CM.net]
  maxLast = Math.max(maxLast, row[CM.last])
}

assert(txTotal === payload.meta.validTransactions, `transaction total ${txTotal} does not match meta ${payload.meta.validTransactions}`)
assert(netTotal > 0, 'net total must be positive')
assert(String(maxLast).length === 8, 'last transaction date must be yyyymmdd')

console.log('RFM aggregate validation passed')
console.log(`  customers             ${payload.customers.length.toLocaleString('en-US')}`)
console.log(`  customer-month rows   ${payload.customerMonthly.length.toLocaleString('en-US')}`)
console.log(`  valid transactions    ${txTotal.toLocaleString('en-US')}`)
console.log(`  net monetary          ${netTotal.toLocaleString('en-US')}`)
